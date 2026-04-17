
using Finocrat.Api.Data;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Org.BouncyCastle.Crypto.Generators;
using System.Text;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FastagController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly FinocratDbContext _dbContext;

        public FastagController(IConfiguration configuration, FinocratDbContext finocratDbContext)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();
            _dbContext = finocratDbContext;
        }

        [HttpPost("Signup")]
        public async Task<IActionResult> Signup([FromBody] FastagSignupRequest request)
        {
            try
            {
                var exists = await _dbContext.eduUsers.AnyAsync(x => x.Email == request.Email);
                if (exists)
                    return BadRequest(new { message = "Email already registered" });

                var user = new Models.Entities.Edu.eduUser
                {
                    Name = request.FirstName,
                    Email = request.Email,
                    PasswordHash = request.Password,
                    phone = request.Phone,
                };

                await _dbContext.eduUsers.AddAsync(user);  // ✅ Properly await the async operation
                await _dbContext.SaveChangesAsync();

                return Ok(new { success = true, message = "Account created successfully" });
                
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] FastagLoginRequest request)
        {
            try
            {

                var user = await _dbContext.eduUsers.FirstOrDefaultAsync(x => x.Email == request.Email && x.PasswordHash == request.Password);
                if (user == null)
                    return Unauthorized(new { message = "Invalid email or password" });

                var token = "";//_jwt.GenerateToken(user);

                return Ok(new
                {
                    success = true,
                    token,
                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        user.phone,
                    }
                });


                //return BadRequest(new { success = false, message = "Invalid email or password" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] FastagForgotPasswordRequest request)
        {
            try
            {
               

                return Ok(new { success = true, message = "OTP sent to your email" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        #region 1. Get FASTag Billers/Providers

        [HttpGet("FastTagBillers")]
        public async Task<IActionResult> FastTagBillers(string searchTerm = "")
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    var clientId = _configuration["InstantPay:X-Ipay-Client-Id"];
                    var clientSecret = _configuration["InstantPay:X-Ipay-Client-Secret"];
                    var outletId = _configuration["InstantPay:X-Ipay-Outlet-Id"];
                    var endpointIp = _configuration["InstantPay:X-Ipay-Endpoint-Ip"];
                    var macAddress = _configuration["DeviceInfo:Mac"];
                    var ipAddress = _configuration["DeviceInfo:Ip"];

                    // Add headers
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", clientId);
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", clientSecret);
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", endpointIp);
                    client.DefaultRequestHeaders.Add("X-Ipay-Outlet-Id", outletId);

                    string url = "https://api.instantpay.in/marketplace/utilityPayments/billers";

                    var requestData = new
                    {
                        pagination = new { pageNumber = 1, recordsPerPage = 100 },
                        filters = new { categoryKey = "C10", updatedAfterDate = "" } // C10 is for FASTag
                    };

                    string json = Newtonsoft.Json.JsonConvert.SerializeObject(requestData);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    HttpResponseMessage response = await client.PostAsync(url, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        return BadRequest(new
                        {
                            success = false,
                            message = "Failed to fetch billers",
                            error = errorContent
                        });
                    }

                    var responseContent = await response.Content.ReadAsStringAsync();
                    var billerResponse = Newtonsoft.Json.JsonConvert.DeserializeObject<FastagBillerResponse>(responseContent);

                    // Filter FASTag billers (categoryKey = "C10")
                    var fastagBillers = billerResponse?.Data?.Records ?? new List<FastagBillerRecord>();

                    // Filter by search term if provided
                    if (!string.IsNullOrWhiteSpace(searchTerm))
                    {
                        fastagBillers = fastagBillers
                            .Where(b => b.BillerName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                            .ToList();
                    }

                    // Transform to expected format for frontend
                    var billers = fastagBillers.Select(b => new
                    {
                        billerId = b.BillerId,
                        billerName = b.BillerName,
                        iconUrl = b.BillerIcon ?? GetBillerIcon(b.BillerName),
                        categoryKey = b.CategoryKey,
                        isActive = b.IsActive
                    }).ToList();

                    return Ok(new
                    {
                        success = true,
                        billers = billers,
                        totalCount = fastagBillers.Count
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // Helper method to get biller icon
        private string GetBillerIcon(string billerName)
        {
            if (billerName.Contains("HDFC"))
                return "https://static.instantpay.in/assets/logo/products/HDFC00000NAT5K.svg";
            if (billerName.Contains("ICICI"))
                return "https://static.instantpay.in/assets/logo/products/TOLL00000NAT72.svg";
            if (billerName.Contains("Axis"))
                return "https://static.instantpay.in/assets/logo/products/AXIS00000NAT31.svg";
            if (billerName.Contains("Paytm"))
                return "https://static.instantpay.in/assets/logo/products/PAYT00000NATTQ.svg";
            if (billerName.Contains("SBI"))
                return "https://static.instantpay.in/assets/logo/products/SBI00000NAT11.svg";

            return "https://static.instantpay.in/assets/logo/products/default.svg";
        }

        #endregion

        #region 2. Fetch FASTag Bill

        [HttpPost("FetchCreditCardBill")]
        public async Task<IActionResult> FetchCreditCardBill([FromBody] FastagBillRequestApp request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrWhiteSpace(request.BillerId))
                {
                    return BadRequest(new { success = false, message = "Please select a provider" });
                }

                if (string.IsNullOrWhiteSpace(request.CreditCardLast4))
                {
                    return BadRequest(new { success = false, message = "Please enter valid vehicle number (last 4 digits)" });
                }

                if (string.IsNullOrWhiteSpace(request.CustomerMobile) || request.CustomerMobile.Length != 10)
                {
                    return BadRequest(new { success = false, message = "Please enter valid mobile number" });
                }

                string paymentMode = "UPI"; // default fallback
                FastagBillInstantPayResponse prePaymentResponse = null;

                using (HttpClient client = new HttpClient())
                {
                    // Headers setup
                    var clientId = _configuration["InstantPay:X-Ipay-Client-Id"];
                    var clientSecret = _configuration["InstantPay:X-Ipay-Client-Secret"];
                    var outletId = _configuration["InstantPay:X-Ipay-Outlet-Id"];
                    var endpointIp = _configuration["InstantPay:X-Ipay-Endpoint-Ip"];
                    var macAddress = _configuration["DeviceInfo:Mac"];
                    var ipAddress = _configuration["DeviceInfo:Ip"];

                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", clientId);
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", clientSecret);
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", endpointIp);
                    client.DefaultRequestHeaders.Add("X-Ipay-Outlet-Id", outletId);

                    // 1. Get biller details to fetch payment modes
                    var billerDetailsBody = new { billerId = request.BillerId };
                    var billerDetailsContent = new StringContent(JsonConvert.SerializeObject(billerDetailsBody), Encoding.UTF8, "application/json");

                    var billerDetailsResponse = await client.PostAsync("https://api.instantpay.in/marketplace/utilityPayments/billerDetails", billerDetailsContent);

                    if (billerDetailsResponse.IsSuccessStatusCode)
                    {
                        var billerDetailsJson = await billerDetailsResponse.Content.ReadAsStringAsync();
                        var billerDetails = JsonConvert.DeserializeObject<FastagBillerResponse11>(billerDetailsJson);

                        if (billerDetails?.Data?.PaymentModes?.Any() == true)
                        {
                            var mode = billerDetails.Data.PaymentModes.FirstOrDefault(t => t.Name == "Wallet");
                            var modeCash = billerDetails.Data.PaymentModes.FirstOrDefault(t => t.Name == "Cash");
                            var modeUpi = billerDetails.Data.PaymentModes.FirstOrDefault(t => t.Name == "UPI");

                            paymentMode = mode?.Name ?? modeCash?.Name ?? modeUpi?.Name ?? "UPI";
                        }
                    }

                    // 2. PrePayment enquiry to fetch customer details and bill amount
                    var externalRef = "Fino" + DateTime.Now.ToString("yyyyMMddHHmmss");

                    var enquiryPayload = new
                    {
                        billerId = request.BillerId,
                        initChannel = "AGT",
                        externalRef = externalRef,
                        inputParameters = new
                        {
                            param1 = request.CreditCardLast4,
                            param2 = request.CustomerMobile
                        },
                        deviceInfo = new
                        {
                            mac = macAddress,
                            ip = ipAddress
                        },
                        remarks = new
                        {
                            param1 = request.CustomerMobile
                        },
                        transactionAmount = 10
                    };

                    var enquiryContent = new StringContent(JsonConvert.SerializeObject(enquiryPayload), Encoding.UTF8, "application/json");
                    var enquiryResponse = await client.PostAsync("https://api.instantpay.in/marketplace/utilityPayments/prePaymentEnquiry", enquiryContent);

                    if (!enquiryResponse.IsSuccessStatusCode)
                    {
                        var errorContent = await enquiryResponse.Content.ReadAsStringAsync();
                        return BadRequest(new
                        {
                            success = false,
                            message = "Failed to fetch bill details. Please try again."
                        });
                    }

                    var enquiryJson = await enquiryResponse.Content.ReadAsStringAsync();
                    prePaymentResponse = JsonConvert.DeserializeObject<FastagBillInstantPayResponse>(enquiryJson);

                    // Check if enquiry was successful
                    if (prePaymentResponse == null || prePaymentResponse.Status != "Transaction Successful")
                    {
                        return Ok(new
                        {
                            success = false,
                            message = prePaymentResponse?.Status ?? "No bill found for this vehicle number"
                        });
                    }

                    // Extract balance and maximum recharge amount from additional details
                    decimal balance = 0;
                    decimal maxRecharge = 0;
                    string customerName = prePaymentResponse.Data?.CustomerName ?? "Customer";

                    if (prePaymentResponse.Data?.AdditionalDetails != null)
                    {
                        var balanceDetail = prePaymentResponse.Data.AdditionalDetails
                            .FirstOrDefault(i => i.Name.Contains("Balance", StringComparison.OrdinalIgnoreCase));

                        var maxRechargeDetail = prePaymentResponse.Data.AdditionalDetails
                            .FirstOrDefault(i => i.Name.Contains("Maximum", StringComparison.OrdinalIgnoreCase) ||
                                                i.Name.Contains("Max", StringComparison.OrdinalIgnoreCase));

                        if (balanceDetail != null)
                        {
                            decimal.TryParse(balanceDetail.Value?.ToString(), out balance);
                        }

                        if (maxRechargeDetail != null)
                        {
                            decimal.TryParse(maxRechargeDetail.Value?.ToString(), out maxRecharge);
                        }
                    }

                    // If balance is 0, try to get from Amount property
                    if (balance == 0 && prePaymentResponse.Data?.Amount > 0)
                    {
                        balance = prePaymentResponse.Data.Amount;
                    }

                    // If maxRecharge is 0, set default
                    if (maxRecharge == 0)
                    {
                        maxRecharge = balance;
                    }

                    // Save enquiry to database for tracking
                    var enquiryReferenceId = prePaymentResponse.Data?.EnquiryReferenceId ??
                                             Guid.NewGuid().ToString();


                    // Return success response
                    return Ok(new FastagBillResponseApp
                    {
                        Success = true,
                        Message = "Bill fetched successfully",
                        ConsumerName = customerName,
                        BillNumber = request.CreditCardLast4,
                        BillDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        DueDate = DateTime.Now.AddDays(15).ToString("yyyy-MM-dd"),
                        TotalAmount = balance,
                        MinPayable = maxRecharge,
                        PaymentMode = paymentMode,
                        Param1 = request.CreditCardLast4,
                        Param2 = request.CustomerMobile,
                        EnquiryReferenceId = enquiryReferenceId,
                        CustomerType = "Individual",
                        AdditionalInfo = new
                        {
                            VehicleNumber = request.CreditCardLast4,
                            MobileNumber = request.CustomerMobile
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching bill",
                    error = ex.Message
                });
            }
        }

        #endregion

       
    }
    
    // Add these model classes in your controller or separate file

    public class FastagBillerResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public FastagBillerData Data { get; set; }
    }

    public class FastagBillerData
    {
        public List<FastagBillerRecord> Records { get; set; }
        public FastagPaginationInfo Pagination { get; set; }
    }

    public class FastagBillerRecord
    {
        public string BillerId { get; set; }
        public string BillerName { get; set; }
        public string CategoryKey { get; set; }
        public string CategoryName { get; set; }
        public bool IsActive { get; set; }
        public string BillerIcon { get; set; }
        public List<FastagBillerField> RequiredFields { get; set; }
        public List<FastagBillerField> OptionalFields { get; set; }
    }

    public class FastagBillerField
    {
        public string FieldName { get; set; }
        public string FieldType { get; set; }
        public bool IsMandatory { get; set; }
        public int MinLength { get; set; }
        public int MaxLength { get; set; }
        public string RegexPattern { get; set; }
    }

    public class FastagPaginationInfo
    {
        public int PageNumber { get; set; }
        public int RecordsPerPage { get; set; }
        public int TotalRecords { get; set; }
    }


    // Request Models
    public class FastagBillRequestApp
    {
        public string BillerId { get; set; }
        public string CreditCardLast4 { get; set; }
        public string CustomerMobile { get; set; }
    }

    public class FastagFetchBillRequest
    {
        public string BillerId { get; set; }
        public string CreditCardLast4 { get; set; }
        public string CustomerMobile { get; set; }
    }

    // Response Models
    public class FastagBillResponseApp
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string ConsumerName { get; set; }
        public string BillNumber { get; set; }
        public string BillDate { get; set; }
        public string DueDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal MinPayable { get; set; }
        public string PaymentMode { get; set; }
        public string Param1 { get; set; }
        public string Param2 { get; set; }
        public string EnquiryReferenceId { get; set; }
        public string CustomerType { get; set; }
        public object AdditionalInfo { get; set; }
    }

    // InstantPay Response Models
    public class FastagBillInstantPayResponse
    {
        public string Status { get; set; }
        public string Message { get; set; }
        public FastagBillInstantPayData Data { get; set; }
    }

    public class FastagBillInstantPayData
    {
        public string CustomerName { get; set; }
        public string EnquiryReferenceId { get; set; }
        public decimal Amount { get; set; }
        public List<FastagAdditionalDetail> AdditionalDetails { get; set; }
    }

    public class FastagAdditionalDetail
    {
        public string Name { get; set; }
        public object Value { get; set; }
    }

    public class FastagBillerResponse11
    {
        public FastagBillerData11 Data { get; set; }
    }

    public class FastagBillerData11
    {
        public List<FastagPaymentMode> PaymentModes { get; set; }
    }

    public class FastagPaymentMode
    {
        public string Name { get; set; }
        public string Code { get; set; }
    }


    public class FastagSignupRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
        public string Gender { get; set; }
    }

    public class FastagLoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class FastagForgotPasswordRequest
    {
        public string Email { get; set; } 
    }
}
