using Finocrat.Api.Data;
using Finocrat.Api.Models.DTOs.MainDtos;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CCController : ControllerBase
    {
        private readonly FinocratDbContext _db;
        private readonly IConfiguration _configuration;
        private readonly DataUtils _dataUtils;

        public CCController(FinocratDbContext db, IConfiguration configuration, DataUtils dataUtils)
        {
            _db = db;
            _configuration = configuration;
            _dataUtils = dataUtils;
        }

        [HttpGet("BalanceCheck")]
        public async Task<IActionResult> BalanceCheck()
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", _configuration["InstantPay:X-Ipay-Client-Id"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", _configuration["InstantPay:X-Ipay-Client-Secret"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", _configuration["InstantPay:X-Ipay-Endpoint-Ip"]);


                    var requestData = new
                    {
                        bankProfileId = "0",
                        accountNumber = "9014559309",
                        externalRef = "PROD1981",
                        latitude = "20.126",
                        longitude = "78.3228"
                    };

                    var jsonData = System.Text.Json.JsonSerializer.Serialize(requestData);
                    var content = new StringContent(jsonData, Encoding.UTF8, "application/json");

                    HttpResponseMessage response = await client.PostAsync(
                        "https://api.instantpay.in/accounts/balance",
                        content
                    );

                    if (!response.IsSuccessStatusCode)
                    {
                        return Ok(new { balance = "0.00" });
                    }

                    string responseContent = await response.Content.ReadAsStringAsync();

                    var balanceResponse = Newtonsoft.Json.JsonConvert
                        .DeserializeObject<BalanceResponse>(responseContent);

                    var balance = balanceResponse?.Data?.Balance?.Available ?? "0.00";

                    return Ok(new
                    {
                        balance = balance,
                        rawResponse = balanceResponse
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = ex.Message
                });
            }
        }


        [HttpGet("CreditCardBillers")]
        public async Task<IActionResult> CreditCardBillers(string searchTerm = "")
        {
            try
            {
                //var userId = HttpContext.Session.GetString("UserId");

              //  var balanceStr = await BlanceCheck();

              //  var useBillAvenue = await _context.PayManGateways.FirstOrDefaultAsync();

                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", _configuration["InstantPay:X-Ipay-Client-Id"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", _configuration["InstantPay:X-Ipay-Client-Secret"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", _configuration["InstantPay:X-Ipay-Endpoint-Ip"]);

                    client.DefaultRequestHeaders.Add("X-Ipay-Outlet-Id", "627849");

                    string url = "https://api.instantpay.in/marketplace/utilityPayments/billers";

                    var requestData = new
                    {
                        pagination = new
                        {
                            pageNumber = 1,
                            recordsPerPage = 100
                        },
                        filters = new
                        {
                            categoryKey = "C15",
                            updatedAfterDate = ""
                        }
                    };

                    var json = Newtonsoft.Json.JsonConvert.SerializeObject(requestData);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    HttpResponseMessage response = await client.PostAsync(url, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        return StatusCode((int)response.StatusCode, new
                        {
                            message = "Failed to fetch billers from InstantPay"
                        });
                    }

                    var responseContent = await response.Content.ReadAsStringAsync();

                    var billerResponse = Newtonsoft.Json.JsonConvert.DeserializeObject<BillerResponse>(responseContent);

                    var records = billerResponse?.Data?.Records ?? new List<BillerRecord>();

                    var filteredBillers = string.IsNullOrWhiteSpace(searchTerm)
                        ? records
                        : records.Where(b => b.BillerName != null &&
                                b.BillerName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                            .ToList();

                    var result = new
                    {
                        AvailableAmount = "0.00",
                        InstantPayBalance = "0.00",
                        BillAvenue =  false,
                        Billers = filteredBillers
                    };

                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        [HttpPost("FetchCreditCardBill")]
        public async Task<IActionResult> FetchCreditCardBill([FromBody] BillRequestApp request)
        {
            if (string.IsNullOrWhiteSpace(request.BillerId) ||
                string.IsNullOrWhiteSpace(request.CreditCardLast4) ||
                string.IsNullOrWhiteSpace(request.RegisteredMobile))
            {
                return BadRequest(new { message = "Invalid request. Please provide all required fields." });
            }

            string mobile = request.RegisteredMobile.Length == 10 ? request.RegisteredMobile : request.CreditCardLast4;
            string lastfour = request.CreditCardLast4.Length == 4 ? request.CreditCardLast4 : request.RegisteredMobile;

            string paymentMode = "UPI";
            string param11 = "";
            string param22 = "";

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

                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", clientId);
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", clientSecret);
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", endpointIp);
                    client.DefaultRequestHeaders.Add("X-Ipay-Outlet-Id", outletId);

                    // 1️⃣ Get Biller Details
                    var billerDetailsBody = new { billerId = request.BillerId };

                    var billerDetailsContent = new StringContent(
                        JsonConvert.SerializeObject(billerDetailsBody),
                        Encoding.UTF8,
                        "application/json"
                    );

                    var billerDetailsResponse = await client.PostAsync(
                        "https://api.instantpay.in/marketplace/utilityPayments/billerDetails",
                        billerDetailsContent
                    );

                    if (!billerDetailsResponse.IsSuccessStatusCode)
                        return StatusCode(500, new { Success = false, Message = "Failed to fetch biller details." });

                    var billerDetailsJson = await billerDetailsResponse.Content.ReadAsStringAsync();

                    var billerDetails = JsonConvert.DeserializeObject<BillerResponse11>(billerDetailsJson);

                    // 2️⃣ Detect Payment Mode
                    if (billerDetails?.Data?.PaymentModes?.Any() == true)
                    {
                        var wallet = billerDetails.Data.PaymentModes
                            .FirstOrDefault(x => x.Name.Equals("Wallet", StringComparison.OrdinalIgnoreCase));

                        var cash = billerDetails.Data.PaymentModes
                            .FirstOrDefault(x => x.Name.Equals("Cash", StringComparison.OrdinalIgnoreCase));

                        paymentMode = wallet?.Name ?? cash?.Name ?? "UPI";
                    }

                    // 3️⃣ Prepare Parameters Safely
                    var parameters = billerDetails?.Data?.Parameters ?? new List<Parameter>();

                    if (parameters.Count > 0)
                        param11 = parameters[0].MaxLength == 10 ? mobile : lastfour;

                    if (parameters.Count > 1)
                        param22 = parameters[1].MaxLength == 10 ? mobile : lastfour;

                    // 4️⃣ Pre Payment Enquiry
                    var enquiryPayload = new
                    {
                        billerId = request.BillerId,
                        initChannel = "AGT",
                        externalRef = "PAYMAN" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                        inputParameters = new
                        {
                            param1 = param11,
                            param2 = param22
                        },
                        deviceInfo = new
                        {
                            mac = macAddress,
                            ip = ipAddress
                        },
                        remarks = new
                        {
                            param1 = request.RegisteredMobile
                        },
                        transactionAmount = 1
                    };

                    var enquiryContent = new StringContent(
                        JsonConvert.SerializeObject(enquiryPayload),
                        Encoding.UTF8,
                        "application/json"
                    );

                    var enquiryResponse = await client.PostAsync(
                        "https://api.instantpay.in/marketplace/utilityPayments/prePaymentEnquiry",
                        enquiryContent
                    );

                    if (!enquiryResponse.IsSuccessStatusCode)
                        return StatusCode(500, new { Success = false, Message = "PrePayment enquiry failed." });

                    var enquiryJson = await enquiryResponse.Content.ReadAsStringAsync();

                    var prePaymentResponse = JsonConvert.DeserializeObject<BillInstantPayResponse>(enquiryJson);

                    if (prePaymentResponse?.Data == null)
                        return NotFound(new { Success = false, Message = "Bill fetch failed." });

                    return Ok(new BillResponseApp
                    {
                        Success = true,
                        Message = "Bill fetched successfully",
                        ConsumerName = prePaymentResponse.Data.CustomerName,
                        BillNumber = prePaymentResponse.Data.BillNumber,
                        BillDate = prePaymentResponse.Data.BillDate,
                        DueDate = prePaymentResponse.Data.BillDueDate,
                        TotalAmount = Convert.ToDecimal(prePaymentResponse.Data.BillAmount),
                        MinPayable = Convert.ToDecimal(prePaymentResponse.Data.BillAmount),
                        PaymentMode = paymentMode,
                        Param1 = param11,
                        Param2 = param22,
                        EnquiryReferenceId = prePaymentResponse.Data.EnquiryReferenceId
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Exception occurred",
                    Details = ex.Message
                });
            }
        }

       
        
        [HttpPost("ProcessPayment")]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequestApp request)
        {
            if (request == null ||
                string.IsNullOrEmpty(request.CustomerMobile) ||
                string.IsNullOrEmpty(request.EnquiryReferenceId) ||
                request.Amount <= 0)
            {
                return Ok(GenerateFailureResponse("Invalid request."));
            }

            var userDetails = await _db.fUsers
                .FirstOrDefaultAsync(t => t.UserPhone == request.Phone);

            if (userDetails == null)
                return Ok(GenerateFailureResponse("User not found"));

            var panNumber = "BRXPK7957B";

            if (panNumber == null)
                return Ok(GenerateFailureResponse("PAN details not found"));

            var walletBalance = await _dataUtils.GetWalletAmount(request.Phone);

            if (request.Amount > walletBalance)
                return Ok(GenerateFailureResponse("Insufficient wallet balance"));

            var externalRef = "PAYMAN" + DateTime.Now.ToString("yyyyMMddHHmmss");

            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

            // ✅ CREATE PAYOUT OBJECT (NOT SAVED YET)
            var payout = new FPayout
            {
                UserId = userDetails.Id,
                UserPhone = request.Phone,
                ExternalRef = externalRef,
                Amount = request.Amount,
                PaoutCommission = 15,
                Created = istNow,
                Status = false
            };

            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", _configuration["InstantPay:X-Ipay-Client-Id"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", _configuration["InstantPay:X-Ipay-Client-Secret"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", _configuration["InstantPay:X-Ipay-Endpoint-Ip"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Outlet-Id", _configuration["InstantPay:X-Ipay-Outlet-Id"]);

                    object paymentInfo;

                    switch (request.PaymentMode?.ToUpper())
                    {
                        case "CASH":
                            paymentInfo = new { Remarks = "CashPayment" };
                            break;

                        case "UPI":
                            paymentInfo = new { remarks = "VPA", vpa = "9652724937@kotak" };
                            break;

                        default:
                            paymentInfo = new { walletName = "Forpay", mobileNo = userDetails.UserPhone };
                            break;
                    }

                    var holderMobile = request.holderMobile ?? userDetails.UserPhone;
                    var holderName = request.customerName ?? userDetails.UserName;

                    var requestData = new
                    {
                        billerId = request.BillerId,
                        externalRef = externalRef,
                        enquiryReferenceId = request.EnquiryReferenceId,
                        initChannel = "AGT",

                        inputParameters = new
                        {
                            param1 = request.Param1,
                            param2 = request.Param2,
                            param3 = holderMobile,
                            param4 = holderName
                        },

                        deviceInfo = new
                        {
                            terminalId = "1998",
                            mobile = userDetails.UserPhone,
                            postalCode = "505402",
                            geoCode = "28.6326,77.2175"
                        },

                        paymentMode = request.PaymentMode,
                        paymentInfo = paymentInfo,

                        remarks = new
                        {
                            param1 = request.CustomerMobile
                        },

                        transactionAmount = request.Amount,
                        customerPan = panNumber
                    };

                    var json = JsonConvert.SerializeObject(requestData);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(
                        "https://api.instantpay.in/marketplace/utilityPayments/payment",
                        content
                    );

                    var responseContent = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                        return Ok(GenerateFailureResponse("InstantPay API failed"));

                    var transactionResponse =
                        JsonConvert.DeserializeObject<TransactionResponse>(responseContent);

                    if (transactionResponse?.Data == null)
                        return Ok(GenerateFailureResponse("Transaction response invalid"));

                    bool status =
                        transactionResponse.Status == "Transaction Successful" ||
                        transactionResponse.Status == "Transaction Under Process";

                    // =========================
                    // ✅ INSERT + UPDATE LOGIC
                    // =========================

                    if (status)
                    {
                        payout.Status = true;
                        payout.TxnReferenceId = transactionResponse.Data.TxnReferenceId;
                        payout.OrderId = transactionResponse.Data.PoolReferenceId;
                        payout.CustomerName = transactionResponse.Data.BillDetails.CustomerName;
                        payout.CardNumber = transactionResponse.Data.BillDetails.CustomerParamsDetails[0].Value;
                        payout.AccountNumber = transactionResponse.Data.BillDetails.CustomerParamsDetails[1].Value;
                        payout.Result = transactionResponse.Status;
                    }
                    else
                    {
                        payout.Result = transactionResponse.Status;
                    }

                    // ✅ ADD PAYOUT
                    await _db.fPayouts.AddAsync(payout);
                    await _db.SaveChangesAsync();

                    // ✅ ADD HISTORY ONLY IF SUCCESS
                    if (status)
                    {
                        var userbalance = await _dataUtils.GetWalletAmount(userDetails.UserPhone);

                        var fhistory = new FPassbookHistory
                        {
                            UserId = userDetails.Id,
                            UserPhone = userDetails.UserPhone,
                            Name = transactionResponse.Data.BillDetails.CustomerName,
                            TxnId = transactionResponse.Data.TxnReferenceId,
                            AccountNumber = transactionResponse.Data.BillDetails.CustomerParamsDetails[1].Value,
                            Amount = payout.Amount,
                            TransactionType = "CC Bill",
                            Status = true,
                            StatusMessage = transactionResponse.Status,
                            ParentId = payout.Id, // will be set after save
                            Balance = userbalance,
                            CreatedAt = istNow
                        };

                        await _dataUtils.InsertFHistoryAsync(fhistory);
                        await _db.SaveChangesAsync();
                    }

                    // ✅ SINGLE SAVE (MOST IMPORTANT)
                    

                    return Ok(new PaymentResponseProcess
                    {
                        Success = status,
                        Amount = transactionResponse.Data.BillDetails?.BillAmount ?? "0",
                        OrderId = transactionResponse.Data.TxnReferenceId,
                        ReferenceId = transactionResponse.Data.ExternalRef,
                        Category = "Credit Card",
                        BillerName = transactionResponse.Data.BillerDetails?.Name,
                        Status = transactionResponse.Status,
                        UserPhone = request.Phone,
                        UserName = userDetails.UserName
                    });
                }
            }
            catch (Exception ex)
            {
                return Ok(GenerateFailureResponse("Exception occurred: " + ex.Message));
            }
        }

        [HttpGet("signup-initiate")]
        public async Task<IActionResult> SignupInitiate()
        {
            try
            {
                string url = "https://api.instantpay.in/user/outlet/signup/initiate";

                // 🔐 Static Encryption Key (use config in prod)
                string key = "a48d5868db327556a48d5868db327556";
                string hjb = "";



                byte[] keyBytes = Encoding.UTF8.GetBytes(key);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = keyBytes;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    // ✅ Generate RANDOM IV (same as PHP)
                    aes.GenerateIV();
                    byte[] iv = aes.IV;

                    using (var encryptor = aes.CreateEncryptor(aes.Key, iv))
                    using (var ms = new MemoryStream())
                    {
                        // ✅ First write IV
                        ms.Write(iv, 0, iv.Length);

                        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                        {
                            byte[] inputBytes = Encoding.UTF8.GetBytes("953633346915");
                            cs.Write(inputBytes, 0, inputBytes.Length);
                            cs.FlushFinalBlock();
                        }

                        // ✅ IV + CipherText → Base64
                        hjb= Convert.ToBase64String(ms.ToArray());
                    }
                }

                // 🔐 Static Aadhaar (ONLY FOR TEST)
                //string encryptedAadhaar = ssEncrypt("527668581152", key);

                var payload = new
                {
                    mobile = "8499977699",  
                    email = "finocart2025@gmail.com",
                    aadhaar = hjb,
                    pan = "EUHPB0418J",
                    latitude = "8.8973",
                    longitude = "68.0880",
                    consent = "Y"
                };

                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", _configuration["InstantPay:X-Ipay-Client-Id"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", _configuration["InstantPay:X-Ipay-Client-Secret"]);
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", _configuration["InstantPay:X-Ipay-Endpoint-Ip"]);

                    var json = JsonConvert.SerializeObject(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(url, content);
                    var result = await response.Content.ReadAsStringAsync();

                    return Ok(new
                    {
                        request = payload,
                        response = result
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "ERROR", message = ex.Message });
            }
        }


        [HttpPost("signup-validate")]
        public async Task<IActionResult> SignupValidate()
        {
            try
            {
                string url = "https://api.instantpay.in/user/outlet/signup/validate";

                var payload = new
                {
                    otpReferenceID = "NWMwNGU4MjYtMWZiNi00NGZmLTk4OTUtM2Y2NzkxZDdiYzRh",
                    otp = "743981",
                    hash = "lbH6q7u0DsKuvdKHemzcsT2dv3P93yWFTUzYWPDfEQItvh0Pua6ZFZWMZZP01pdTkK+P3rpbX2WPX6I\\/JtJWgyESGNRlx9SYRQCcboAfN7fsTfvb0w5FFe7JeE7JeM33\\/lMX6s4WGOyCPB5yuGzcNYZi4JWoL\\/a\\/L30HjIeekTMGsy5ZLuwk6\\/Cg1RLlOSd8HOr9RxcB1YPRikg5klRt4Q=="
                };

                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");

                    // 🔥 SAFE CONFIG (avoid null crash)
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", _configuration["InstantPay:X-Ipay-Client-Id"] ?? "");
                    client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", _configuration["InstantPay:X-Ipay-Client-Secret"] ?? "");
                    client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", _configuration["InstantPay:X-Ipay-Endpoint-Ip"] ?? "");

                    var json = JsonConvert.SerializeObject(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(url, content);
                    var result = await response.Content.ReadAsStringAsync();

                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message }); // 👈 avoid crash
            }
        }

        //public string ssEncrypt(string aadhaar, string key)
        //{
        //    byte[] keyBytes = Encoding.UTF8.GetBytes(key.PadRight(32).Substring(0, 32));

        //    using (Aes aes = Aes.Create())
        //    {
        //        aes.Key = keyBytes;
        //        aes.GenerateIV();
        //        aes.Mode = CipherMode.CBC;
        //        aes.Padding = PaddingMode.PKCS7;

        //        using (var encryptor = aes.CreateEncryptor(aes.Key, aes.IV))
        //        using (var ms = new MemoryStream())
        //        {
        //            ms.Write(aes.IV, 0, aes.IV.Length);

        //            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        //            {
        //                var inputBytes = Encoding.UTF8.GetBytes(aadhaar);
        //                cs.Write(inputBytes, 0, inputBytes.Length);
        //                cs.FlushFinalBlock();
        //            }

        //            return Convert.ToBase64String(ms.ToArray());
        //        }
        //    }
        //}
        private PaymentResponseProcess GenerateFailureResponse(string message, string status = "FAILED")
        {
            return new PaymentResponseProcess
            {
                Success = false,
                Amount = "",
                OrderId = "",
                ReferenceId = "",
                Category = "Credit Card",
                BillerName = "ICICI Credit Card",
                Status = status,
                Message = message
            };
        }


    }


}
