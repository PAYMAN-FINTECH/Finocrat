using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Finocrat.Api.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Finocrat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BharatConnectBillersController : ControllerBase
    {
        private readonly FinocratDbContext _context;
        private readonly ILogger<BharatConnectBillersController> _logger;
        private readonly BillAvenueService _billAvenue;
        private readonly DataUtils _dataUtils;
        private readonly IConfiguration _configuration;

        public BharatConnectBillersController(FinocratDbContext context, ILogger<BharatConnectBillersController> logger, BillAvenueService billAvenue, DataUtils dataUtils, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _billAvenue = billAvenue;
            _dataUtils = dataUtils;
            _configuration = configuration;
        }

        /// <summary>
        /// Get biller info from BillAvenue MDM, store it in BillerInfo and return it.
        /// Uses the stored copy unless refresh=true.
        /// </summary>
        [HttpPost("{billerId}/info")]
        public async Task<IActionResult> FetchAndStoreBillerInfo(string billerId, [FromQuery] bool refresh = false)
        {
            try
            {
                var biller = await _context.BharatConnectBillers.FirstOrDefaultAsync(b => b.BlrId == billerId);
                if (biller == null)
                    return NotFound(new { success = false, message = "Biller not found" });

                var cached = !refresh && !string.IsNullOrWhiteSpace(biller.BillerInfo);
                var xml = biller.BillerInfo;

                if (!cached)
                {
                    xml = await _billAvenue.GetBillerInfoXmlAsync(billerId);

                    if (!BillAvenueService.IsValidBillerInfo(xml))
                    {
                        _logger.LogWarning("BillAvenue returned no biller info for {BillerId}: {Response}", billerId, xml);
                        return StatusCode(502, new { success = false, message = "BillAvenue did not return biller info", response = xml });
                    }

                    biller.BillerInfo = xml;
                    await _context.SaveChangesAsync();
                }

                var b = System.Xml.Linq.XDocument.Parse(xml!).Descendants("biller").First();
                string? V(System.Xml.Linq.XElement e, string n) => e.Element(n)?.Value?.Trim();

                var inputParams = (b.Element("billerInputParams")?.Elements("paramInfo") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Select(p => new
                    {
                        paramName = V(p, "paramName"),
                        dataType = V(p, "dataType"),
                        isOptional = string.Equals(V(p, "isOptional"), "true", StringComparison.OrdinalIgnoreCase),
                        minLength = int.TryParse(V(p, "minLength"), out var mn) ? mn : (int?)null,
                        maxLength = int.TryParse(V(p, "maxLength"), out var mx) ? mx : (int?)null,
                        regEx = V(p, "regEx"),
                        visibility = !string.Equals(V(p, "visibility"), "false", StringComparison.OrdinalIgnoreCase)
                    }).ToList();

                var paymentModes = (b.Element("billerPaymentModes")?.Elements("paymentModeInfo") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Select(p => new { paymentMode = V(p, "paymentMode"), minAmount = V(p, "minAmount"), maxAmount = V(p, "maxAmount") }).ToList();

                return Ok(new
                {
                    success = true,
                    cached,
                    billerId,
                    biller = new
                    {
                        billerName = V(b, "billerName"),
                        billerCategory = V(b, "billerCategory"),
                        billerCoverage = V(b, "billerCoverage"),
                        billerStatus = V(b, "billerStatus"),
                        fetchRequirement = V(b, "billerFetchRequiremet"),
                        paymentExactness = V(b, "billerPaymentExactness"),
                        supportBillValidation = V(b, "billerSupportBillValidation"),
                        amountOptions = V(b, "billerAmountOptions"),
                        inputParams,
                        paymentModes
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching biller info for {BillerId}", billerId);
                return StatusCode(500, new { success = false, message = "Failed to fetch biller info", error = ex.Message });
            }
        }

        public class BharatFetchBillInput { public string? ParamName { get; set; } public string? ParamValue { get; set; } }
        public class BharatFetchBillRequest
        {
            public string? CustomerMobile { get; set; }
            public string? CustomerEmail { get; set; }
            public List<BharatFetchBillInput>? InputParams { get; set; }
        }

        /// <summary>
        /// Call BillAvenue Bill Fetch and return normalized bill details (amounts in paise).
        /// </summary>
        [HttpPost("{billerId}/fetch-bill")]
        public async Task<IActionResult> FetchBill(string billerId, [FromBody] BharatFetchBillRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.CustomerMobile) ||
                    !System.Text.RegularExpressions.Regex.IsMatch(req.CustomerMobile, "^[6-9][0-9]{9}$"))
                    return BadRequest(new { success = false, message = "A valid 10 digit customer mobile number is required" });

                var supplied = (req.InputParams ?? new List<BharatFetchBillInput>())
                    .Where(i => !string.IsNullOrWhiteSpace(i.ParamName) && !string.IsNullOrWhiteSpace(i.ParamValue))
                    .GroupBy(i => i.ParamName!.Trim(), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First().ParamValue!.Trim(), StringComparer.OrdinalIgnoreCase);

                var biller = await _context.BharatConnectBillers.AsNoTracking().FirstOrDefaultAsync(b => b.BlrId == billerId);
                if (biller == null)
                    return NotFound(new { success = false, message = "Biller not found" });
                if (string.IsNullOrWhiteSpace(biller.BillerInfo))
                    return BadRequest(new { success = false, message = "Biller info is not loaded. Open the biller again." });

                var info = System.Xml.Linq.XDocument.Parse(biller.BillerInfo).Descendants("biller").First();
                var fetchRequirement = info.Element("billerFetchRequiremet")?.Value?.Trim();
                if (string.Equals(fetchRequirement, "NOT_SUPPORTED", StringComparison.OrdinalIgnoreCase))
                    return Ok(new { success = false, message = "This biller does not support bill fetch. Enter the amount directly." });

                // Only visible, mandatory params are entered by the user; hidden ones are not expected from the UI
                var missing = (info.Element("billerInputParams")?.Elements("paramInfo") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Where(p => !string.Equals(p.Element("isOptional")?.Value?.Trim(), "true", StringComparison.OrdinalIgnoreCase)
                                && !string.Equals(p.Element("visibility")?.Value?.Trim(), "false", StringComparison.OrdinalIgnoreCase))
                    .Select(p => p.Element("paramName")?.Value?.Trim() ?? "")
                    .Where(n => n.Length > 0 && !supplied.ContainsKey(n))
                    .ToList();
                if (missing.Count > 0)
                    return BadRequest(new { success = false, message = "Missing required fields: " + string.Join(", ", missing) });

                var channels = (info.Element("billerPaymentChannels")?.Elements("paymentChannelInfo") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Select(c => c.Element("paymentChannelName")?.Value?.Trim() ?? "")
                    .Where(c => c.Length > 0)
                    .ToList();
                if (!channels.Any(c => string.Equals(c, "INT", StringComparison.OrdinalIgnoreCase)))
                    return BadRequest(new { success = false, message = "This biller does not support the INT payment channel" });

                var xml = await _billAvenue.FetchBillXmlAsync(billerId, channels, req.CustomerMobile, req.CustomerEmail,
                    supplied.Select(kv => new KeyValuePair<string, string>(kv.Key, kv.Value)),
                    HttpContext.Connection.RemoteIpAddress?.ToString());

                System.Xml.Linq.XElement root;
                try
                {
                    root = System.Xml.Linq.XDocument.Parse(xml).Root!;
                }
                catch (System.Xml.XmlException)
                {
                    _logger.LogWarning("Unparseable bill fetch response for {BillerId}: {Xml}", billerId, xml);
                    return Ok(new { success = false, responseCode = (string?)null, message = "BillAvenue returned an unexpected response", response = xml });
                }
                string? V(System.Xml.Linq.XElement? e, string n) => e?.Element(n)?.Value?.Trim();
                var code = V(root, "responseCode");

                if (code != "000")
                {
                    var errors = root.Descendants("error")
                        .Select(e => new { errorCode = V(e, "errorCode"), errorMessage = V(e, "errorMessage") }).ToList();
                    var msg = errors.FirstOrDefault()?.errorMessage ?? V(root, "errorMessage") ?? "Bill fetch failed";
                    _logger.LogWarning("Bill fetch failed for {BillerId}: {Xml}", billerId, xml);
                    return Ok(new { success = false, responseCode = code, message = msg, errors });
                }

                var br = root.Element("billerResponse");
                var options = (br?.Element("amountOptions")?.Elements() ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Select(o => new { amountName = V(o, "amountName"), amountValue = V(o, "amountValue") }).ToList();
                var additional = (root.Element("additionalInfo")?.Elements("info") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Select(o => new { infoName = V(o, "infoName"), infoValue = V(o, "infoValue") }).ToList();
                var echoed = (root.Element("inputParams")?.Elements("input") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Select(o => new { paramName = V(o, "paramName"), paramValue = V(o, "paramValue") }).ToList();

                return Ok(new
                {
                    success = true,
                    responseCode = code,
                    bill = new
                    {
                        customerName = V(br, "customerName"),
                        billAmount = V(br, "billAmount"),
                        billNumber = V(br, "billNumber"),
                        billDate = V(br, "billDate"),
                        billPeriod = V(br, "billPeriod"),
                        dueDate = V(br, "dueDate"),
                        amountOptions = options,
                        additionalInfo = additional,
                        inputParams = echoed
                    }
                });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching bill for {BillerId}", billerId);
                return StatusCode(500, new { success = false, message = "Failed to fetch bill", error = ex.Message });
            }
        }

        public class BharatPayBillRequest
        {
            public string? UserPhone { get; set; }
            public string? CustomerMobile { get; set; }
            public string? CustomerEmail { get; set; }
            public List<BharatFetchBillInput>? InputParams { get; set; }
            public decimal Amount { get; set; }
            /// <summary>Fields from the bill fetch response (billAmount in paise, customerName, billNumber, billDate, billPeriod, dueDate).</summary>
            public Dictionary<string, string>? BillerResponse { get; set; }
            public List<BharatFetchBillInput>? AdditionalInfo { get; set; }
        }

        /// <summary>
        /// Pay a bill through BillAvenue for an amount entered by the user.
        /// The channel and payment mode come from configuration (BillAvenue:InitChannel, BillAvenue:PaymentMode).
        /// The user's wallet is debited only when BillAvenue confirms the payment (responseCode 000).
        /// </summary>
        [HttpPost("{billerId}/pay")]
        public async Task<IActionResult> PayBill(string billerId, [FromBody] BharatPayBillRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.UserPhone))
                    return BadRequest(new { success = false, message = "User phone is required" });
                if (string.IsNullOrWhiteSpace(req.CustomerMobile) ||
                    !System.Text.RegularExpressions.Regex.IsMatch(req.CustomerMobile, "^[6-9][0-9]{9}$"))
                    return BadRequest(new { success = false, message = "A valid 10 digit customer mobile number is required" });
                if (req.Amount <= 0)
                    return BadRequest(new { success = false, message = "Enter an amount greater than zero" });

                var user = await _context.fUsers.AsNoTracking().FirstOrDefaultAsync(u => u.UserPhone == req.UserPhone);
                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                var biller = await _context.BharatConnectBillers.FirstOrDefaultAsync(b => b.BlrId == billerId);
                if (biller == null)
                    return NotFound(new { success = false, message = "Biller not found" });
                if (string.IsNullOrWhiteSpace(biller.BillerInfo))
                    return BadRequest(new { success = false, message = "Biller info is not loaded. Open the biller again." });

                var info = System.Xml.Linq.XDocument.Parse(biller.BillerInfo).Descendants("biller").First();
                string? IV(string name) => info.Element(name)?.Value?.Trim();

                var channel = _configuration["BillAvenue:InitChannel"] ?? "AGT";
                var paymentMode = _configuration["BillAvenue:PaymentMode"] ?? "Cash";

                var channels = (info.Element("billerPaymentChannels")?.Elements("paymentChannelInfo") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .Select(c => c.Element("paymentChannelName")?.Value?.Trim() ?? "")
                    .Where(c => c.Length > 0)
                    .ToList();
                if (!channels.Any(c => string.Equals(c, channel, StringComparison.OrdinalIgnoreCase)))
                    return BadRequest(new { success = false, message = $"This biller does not support the {channel} payment channel" });

                // Amount limits from the biller's payment mode (BillAvenue returns them in paise)
                var mode = (info.Element("billerPaymentModes")?.Elements("paymentModeInfo") ?? Enumerable.Empty<System.Xml.Linq.XElement>())
                    .FirstOrDefault(m => string.Equals(m.Element("paymentMode")?.Value?.Trim(), paymentMode, StringComparison.OrdinalIgnoreCase));
                if (mode == null)
                    return BadRequest(new { success = false, message = $"Payment mode '{paymentMode}' is not accepted by this biller" });

                var amountPaise = (long)Math.Round(req.Amount * 100m, MidpointRounding.AwayFromZero);
                long.TryParse(mode.Element("minAmount")?.Value?.Trim(), out var minPaise);
                long.TryParse(mode.Element("maxAmount")?.Value?.Trim(), out var maxPaise);
                if (maxPaise > 0 && (amountPaise < minPaise || amountPaise > maxPaise))
                    return BadRequest(new { success = false, message = $"Amount must be between ₹{minPaise / 100m:0.00} and ₹{maxPaise / 100m:0.00} for {paymentMode}" });

                long billAmountPaise = 0;
                var billerResponseFields = new List<KeyValuePair<string, string>>();
                foreach (var kv in req.BillerResponse ?? new Dictionary<string, string>())
                {
                    // Keys become XML element names, so only plain names are accepted
                    if (!System.Text.RegularExpressions.Regex.IsMatch(kv.Key, "^[A-Za-z][A-Za-z0-9_]*$") || string.IsNullOrWhiteSpace(kv.Value))
                        continue;
                    billerResponseFields.Add(new KeyValuePair<string, string>(kv.Key, kv.Value.Trim()));
                }
                var billAmountField = billerResponseFields.FirstOrDefault(kv => kv.Key == "billAmount").Value;
                if (!string.IsNullOrWhiteSpace(billAmountField) && !long.TryParse(billAmountField, out billAmountPaise))
                    return BadRequest(new { success = false, message = "Invalid bill amount" });
                if (billAmountPaise == 0)
                    billAmountPaise = amountPaise;
                if (billerResponseFields.All(kv => kv.Key != "billAmount"))
                    billerResponseFields.Insert(0, new KeyValuePair<string, string>("billAmount", billAmountPaise.ToString()));

                // Balance check before calling BillAvenue
                var walletBefore = await _dataUtils.GetWalletAmount(user.UserPhone);
                if (walletBefore < req.Amount)
                    return BadRequest(new { success = false, message = $"Insufficient wallet balance. Available ₹{walletBefore:0.00}" });

                var supplied = (req.InputParams ?? new List<BharatFetchBillInput>())
                    .Where(i => !string.IsNullOrWhiteSpace(i.ParamName) && !string.IsNullOrWhiteSpace(i.ParamValue))
                    .GroupBy(i => i.ParamName!.Trim(), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First().ParamValue!.Trim(), StringComparer.OrdinalIgnoreCase);

                var additional = (req.AdditionalInfo ?? new List<BharatFetchBillInput>())
                    .Where(i => !string.IsNullOrWhiteSpace(i.ParamName) && !string.IsNullOrWhiteSpace(i.ParamValue))
                    .Select(i => new KeyValuePair<string, string>(i.ParamName!.Trim(), i.ParamValue!.Trim()))
                    .ToList();

                var xml = await _billAvenue.PayBillXmlAsync(billerId, amountPaise, req.CustomerMobile, req.CustomerEmail,
                    supplied.Select(kv => new KeyValuePair<string, string>(kv.Key, kv.Value)),
                    billerResponseFields, additional);

                System.Xml.Linq.XElement root;
                try
                {
                    root = System.Xml.Linq.XDocument.Parse(xml).Root!;
                }
                catch (System.Xml.XmlException)
                {
                    _logger.LogWarning("Unparseable bill payment response for {BillerId}: {Xml}", billerId, xml);
                    return StatusCode(502, new { success = false, message = "BillAvenue returned an unexpected response", response = xml });
                }

                string? V(System.Xml.Linq.XElement? e, string n) => e?.Element(n)?.Value?.Trim();
                var code = V(root, "responseCode");
                var txnRefId = V(root, "txnRefId");
                var approvalRef = V(root, "approvalRefNumber");
                var reason = V(root, "responseReason");

                if (code != "000")
                {
                    _logger.LogWarning("Bill payment not successful for {BillerId}: {Xml}", billerId, xml);
                    return Ok(new
                    {
                        success = false,
                        responseCode = code,
                        message = reason ?? "Bill payment failed. Your wallet has not been debited.",
                        txnRefId,
                        approvalRefNumber = approvalRef
                    });
                }

                // Payment confirmed by BillAvenue: debit the wallet
                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
                var reference = string.IsNullOrWhiteSpace(txnRefId) ? Guid.NewGuid().ToString("N") : txnRefId!;
                var billerName = IV("billerName");

                var payout = new Models.Entities.Main.FPayout
                {
                    UserId = user.Id,
                    UserPhone = user.UserPhone,
                    ExternalRef = reference,
                    TxnReferenceId = reference,
                    OrderId = reference,
                    CustomerName = billerName,
                    Amount = req.Amount,
                    PaoutCommission = 0,
                    Status = true,
                    Type = "BillPay",
                    Result = "SUCCESS",
                    Created = istNow,
                    CardNumber = req.CustomerMobile,
                    AccountNumber = billerId
                };
                await _context.fPayouts.AddAsync(payout);
                await _context.SaveChangesAsync();

                var walletAfter = await _dataUtils.GetWalletAmount(user.UserPhone);

                await _context.fPassbookHistories.AddAsync(new Models.Entities.Main.FPassbookHistory
                {
                    UserId = user.Id,
                    UserPhone = user.UserPhone,
                    Name = billerName ?? "Bill Payment",
                    TxnId = reference,
                    AccountNumber = billerId,
                    Amount = req.Amount,
                    TransactionType = "BillPay",
                    Status = true,
                    StatusMessage = approvalRef ?? "Bill payment successful",
                    ParentId = payout.Id,
                    Balance = walletAfter,
                    CreatedAt = istNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    responseCode = code,
                    message = reason ?? "Bill payment successful",
                    txnRefId = txnRefId,
                    approvalRefNumber = approvalRef,
                    amount = req.Amount,
                    walletBalance = walletAfter
                });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error paying bill for {BillerId}", billerId);
                return StatusCode(500, new { success = false, message = "Failed to pay bill", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all distinct BLR category names from BharatConnectBillers table
        /// </summary>
        [HttpGet("distinct-categories")]
        public async Task<IActionResult> GetDistinctCategories()
        {
            try
            {
                var categories = await _context.BharatConnectBillers
                    .AsNoTracking()
                    .Select(b => b.BlrCategoryName)
                    .Where(c => !string.IsNullOrEmpty(c))
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {categories.Count} distinct BBPS categories");

                return Ok(new
                {
                    success = true,
                    message = "Distinct categories retrieved successfully",
                    data = categories,
                    count = categories.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving distinct categories: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve categories",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all billers in a specific category
        /// </summary>
        [HttpGet("category/{categoryName}")]
        public async Task<IActionResult> GetBillersByCategory(string categoryName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(categoryName))
                    return BadRequest(new { success = false, message = "Category name is required" });

                var billers = await _context.BharatConnectBillers
                    .AsNoTracking()
                    .Where(b => b.BlrCategoryName == categoryName && b.IsActive)
                    .OrderBy(b => b.BlrName)
                    .Select(b => new
                    {
                        b.Id, b.BlrId, b.BlrName, b.BlrAliasName, b.BlrCategoryName,
                        b.BlrCoverage, b.IsActive, b.IconUrl, b.CreatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {billers.Count} billers for category: {categoryName}");

                return Ok(new
                {
                    success = true,
                    message = "Billers retrieved successfully",
                    data = billers,
                    count = billers.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving billers for category {categoryName}: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve billers",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Search billers by name or ID
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchBillers([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                    return BadRequest(new { success = false, message = "Search query is required" });

                var searchTerm = query.ToLower();
                var billers = await _context.BharatConnectBillers
                    .AsNoTracking()
                    .Where(b => b.IsActive && (
                        b.BlrName.ToLower().Contains(searchTerm) ||
                        b.BlrId.ToLower().Contains(searchTerm) ||
                        b.BlrAliasName.ToLower().Contains(searchTerm)
                    ))
                    .OrderBy(b => b.BlrName)
                    .Take(50)
                    .ToListAsync();

                _logger.LogInformation($"Search found {billers.Count} billers matching: {query}");

                return Ok(new
                {
                    success = true,
                    message = "Search completed",
                    data = billers,
                    count = billers.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching billers: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Search failed",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get a specific biller by ID
        /// </summary>
        [HttpGet("{billerId}")]
        public async Task<IActionResult> GetBillerById(string billerId)
        {
            try
            {
                var biller = await _context.BharatConnectBillers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BlrId == billerId);

                if (biller == null)
                    return NotFound(new { success = false, message = "Biller not found" });

                return Ok(new
                {
                    success = true,
                    message = "Biller retrieved successfully",
                    data = biller
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving biller {billerId}: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve biller",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get statistics about the BharatConnectBillers database
        /// </summary>
        [HttpGet("stats/overview")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalBillers = await _context.BharatConnectBillers.CountAsync();
                var activeBillers = await _context.BharatConnectBillers.CountAsync(b => b.IsActive);
                var categories = await _context.BharatConnectBillers
                    .AsNoTracking()
                    .Select(b => b.BlrCategoryName)
                    .Distinct()
                    .CountAsync();
                var regions = await _context.BharatConnectBillers
                    .AsNoTracking()
                    .Select(b => b.BlrCoverage)
                    .Distinct()
                    .CountAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalBillers,
                        activeBillers,
                        categories,
                        regions,
                        inactiveBillers = totalBillers - activeBillers
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving stats: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve stats",
                    error = ex.Message
                });
            }
        }
    }
}
