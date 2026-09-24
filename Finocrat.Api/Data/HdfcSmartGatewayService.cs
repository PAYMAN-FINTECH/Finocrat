using Finocrat.Api.Models.Entities.Main;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HttpMethod = System.Net.Http.HttpMethod;

namespace Finocrat.Api.Data
{
    public class HdfcSmartGatewayService
    {

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly FinocratDbContext _db;
        private readonly DataUtils _dataUtils;



        public HdfcSmartGatewayService(
            HttpClient httpClient,
            IConfiguration configuration,
            FinocratDbContext db,
            DataUtils dataUtils)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _db = db;
            _dataUtils = dataUtils;
        }


        // =========================================================
        // CREATE HDFC SESSION
        // =========================================================

        public async Task<JsonElement> CreateSessionAsync(
    string orderId,
    decimal amount,
    string customerId,
    string customerEmail,
    string customerPhone,
    string firstName,
    string lastName,
    string LoggedInUserPhone,
    string cardnum,
    string SelectedGateway)
        {
            var baseUrl =
                _configuration["HdfcSmartGateway:BaseUrl"];

            var apiKey =
                _configuration["HdfcSmartGateway:ApiKey"];

            var merchantId =
                _configuration["HdfcSmartGateway:MerchantId"];

            var paymentPageClientId =
                _configuration["HdfcSmartGateway:PaymentPageClientId"];

            var returnUrl =
                _configuration["HdfcSmartGateway:ReturnUrl"];


            // -----------------------------------------------------
            // Validate Configuration
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(baseUrl))
                throw new Exception(
                    "HDFC BaseUrl is not configured.");

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new Exception(
                    "HDFC API Key is not configured.");

            if (string.IsNullOrWhiteSpace(merchantId))
                throw new Exception(
                    "HDFC Merchant ID is not configured.");

            if (string.IsNullOrWhiteSpace(paymentPageClientId))
                throw new Exception(
                    "HDFC Payment Page Client ID is not configured.");

            if (string.IsNullOrWhiteSpace(returnUrl))
                throw new Exception(
                    "HDFC Return URL is not configured.");


            var CustomeId =
                    "FINOCUST_" +
                    DateTime.UtcNow
                        .ToString("yyyyMMddHHmmssfff");

            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);


            var user = await _db.fUsers.FirstOrDefaultAsync(t => t.UserPhone == LoggedInUserPhone);

            var payIn = new FPayIn
            {
                UserId = user.Id,

                UserPhone = LoggedInUserPhone,
                UserEmail = user.Email,
                CardHolderName = firstName,
                CardHolderPhone = customerPhone,
                CardHolderEmail = customerEmail,
                CardHolderCardNumber = cardnum,
                Result = "",
                Status = false,
                CardBrand = "",
                BankName = "",
                CardType = "",
                CardNo = "",
                PaymentId = CustomeId,
                TaxNumber = orderId,
                Amount = amount,
                PayInCommission = 0,
                FCommission = 0,
                Gateway = SelectedGateway,
                Created = istNow
            };

            await _db.fPayIns.AddAsync(payIn);
            await _db.SaveChangesAsync();


            // -----------------------------------------------------
            // Create HTTP Request
            // -----------------------------------------------------

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{baseUrl.TrimEnd('/')}/session");


            // -----------------------------------------------------
            // HDFC BASIC AUTHENTICATION
            //
            // HDFC expects:
            //
            // Authorization: Basic <Base64 API Key>
            //
            // Example:
            //
            // API Key: 1234
            // Base64 : MTIzNA==
            //
            // Header:
            // Authorization: Basic MTIzNA==
            // -----------------------------------------------------

            var encodedApiKey =
                Convert.ToBase64String(
                    Encoding.UTF8.GetBytes(
                        apiKey.Trim()
                    )
                );

            request.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Basic",
                    encodedApiKey
                );


            // -----------------------------------------------------
            // HDFC Required Headers
            // -----------------------------------------------------

            request.Headers.Add(
                "x-merchantid",
                merchantId.Trim()
            );

            request.Headers.Add(
                "x-customerid",
                customerId.Trim()
            );

            request.Headers.Accept.Add(
                new MediaTypeWithQualityHeaderValue(
                    "application/json"
                )
            );


            // -----------------------------------------------------
            // Request Body
            // -----------------------------------------------------

            var requestBody = new
            {
                order_id = orderId,

                amount = amount.ToString(
                    "0.00",
                    CultureInfo.InvariantCulture
                ),

                customer_id = customerId,

                customer_email = customerEmail,

                customer_phone = customerPhone,

                payment_page_client_id =
                    paymentPageClientId,

                action = "paymentPage",

                currency = "INR",

                return_url = returnUrl,

                description =
                    "Education Payments",

                first_name = firstName,

                last_name = lastName
            };


            // -----------------------------------------------------
            // Serialize JSON
            // -----------------------------------------------------

            var json =
                JsonSerializer.Serialize(requestBody);


            request.Content =
                new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );


            // -----------------------------------------------------
            // Send Request
            // -----------------------------------------------------

            var response =
                await _httpClient.SendAsync(request);


            var responseContent =
                await response.Content.ReadAsStringAsync();


            // -----------------------------------------------------
            // Handle HDFC Error
            // -----------------------------------------------------

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception(
                    $"HDFC Session API Error: " +
                    $"{(int)response.StatusCode} " +
                    $"{response.StatusCode}. " +
                    $"{responseContent}"
                );
            }


            // -----------------------------------------------------
            // Parse HDFC Response
            // -----------------------------------------------------

            using var document =
                JsonDocument.Parse(responseContent);


            return document
                .RootElement
                .Clone();
        }


        // =========================================================
        // GET ORDER STATUS
        // =========================================================

        public async Task<HdfcOrderStatusResponse> GetOrderStatusAsync(
    string orderId,
    string customerId)
        {
            // =========================================================
            // CONFIGURATION
            // =========================================================

            var baseUrl =
                _configuration[
                    "HdfcSmartGateway:BaseUrl"];

            var apiKey =
                _configuration[
                    "HdfcSmartGateway:ApiKey"];

            var merchantId =
                _configuration[
                    "HdfcSmartGateway:MerchantId"];


            // =========================================================
            // VALIDATION
            // =========================================================

            if (string.IsNullOrWhiteSpace(baseUrl))
                throw new Exception(
                    "HdfcSmartGateway:BaseUrl is missing.");

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new Exception(
                    "HdfcSmartGateway:ApiKey is missing.");

            if (string.IsNullOrWhiteSpace(merchantId))
                throw new Exception(
                    "HdfcSmartGateway:MerchantId is missing.");

            if (string.IsNullOrWhiteSpace(orderId))
                throw new ArgumentException(
                    "Order ID cannot be empty.",
                    nameof(orderId));

            if (string.IsNullOrWhiteSpace(customerId))
                throw new ArgumentException(
                    "Customer ID cannot be empty.",
                    nameof(customerId));


            // =========================================================
            // FIND PAYIN TRANSACTION
            // =========================================================

            var payiis =
                await _db.fPayIns
                    .FirstOrDefaultAsync(
                        t => t.TaxNumber == orderId
                    );


            // =========================================================
            // HDFC ORDER STATUS URL
            // =========================================================

            var url =
                $"{baseUrl.TrimEnd('/')}/orders/" +
                $"{Uri.EscapeDataString(orderId)}";


            Console.WriteLine(
                "SmartGateway Order Status URL: "
                + url
            );


            // =========================================================
            // REQUEST
            // =========================================================

            using var request =
                new HttpRequestMessage(
                    HttpMethod.Get,
                    url);


            // =========================================================
            // BASIC AUTH
            // =========================================================

            var credentials =
                Convert.ToBase64String(
                    Encoding.UTF8.GetBytes(
                        $"{apiKey}:"
                    )
                );


            request.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Basic",
                    credentials);


            // =========================================================
            // HDFC HEADERS
            // =========================================================

            request.Headers.TryAddWithoutValidation(
                "version",
                "2023-06-30"
            );

            request.Headers.TryAddWithoutValidation(
                "x-merchantid",
                merchantId
            );

            request.Headers.TryAddWithoutValidation(
                "x-customerid",
                payiis.PaymentId
            );


            request.Headers.Accept.Clear();

            request.Headers.Accept.Add(
                new MediaTypeWithQualityHeaderValue(
                    "application/json"
                ));


            // =========================================================
            // CALL HDFC
            // =========================================================

            using var response =
                await _httpClient.SendAsync(request);


            var responseBody =
                await response.Content.ReadAsStringAsync();


            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"SmartGateway Order Status API failed. " +
                    $"HTTP {(int)response.StatusCode}: " +
                    responseBody
                );
            }


            // =========================================================
            // EMPTY RESPONSE
            // =========================================================

            if (string.IsNullOrWhiteSpace(responseBody))
            {
                throw new Exception(
                    "SmartGateway returned an empty order status response."
                );
            }


            // =========================================================
            // DESERIALIZE HDFC RESPONSE
            // =========================================================

            var result =
                JsonSerializer.Deserialize<HdfcOrderStatusResponse>(
                    responseBody,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });


            // =========================================================
            // DESERIALIZATION VALIDATION
            // =========================================================

            if (result == null)
            {
                throw new Exception(
                    "Unable to deserialize SmartGateway order status response."
                );
            }


            


            if (payiis == null)
            {
                throw new KeyNotFoundException(
                    $"PayIn transaction not found for Order ID: {orderId}"
                );
            }


            // =========================================================
            // FIND USER
            // =========================================================

            var user =
                await _db.fUsers
                    .FirstOrDefaultAsync(
                        t => t.UserPhone == payiis.UserPhone
                    );


            if (user == null)
            {
                throw new KeyNotFoundException(
                    $"User not found for phone number: {payiis.UserPhone}"
                );
            }


            // =========================================================
            // PAYMENT STATUS
            // =========================================================

            bool isCharged =
                string.Equals(
                    result.Status,
                    "CHARGED",
                    StringComparison.OrdinalIgnoreCase
                );


            // =========================================================
            // PAY-IN COMMISSION
            // =========================================================

            decimal payInLimit = 0;


            if (isCharged)
            {
                var lookup =
                    await _db.fUserLookups
                        .FirstOrDefaultAsync(
                            x => x.UserPhone == payiis.UserPhone
                        );


                if (lookup != null)
                {
                    payInLimit =
                        ExtractPayInMargin(
                            lookup,
                            "visa"
                        );
                }
            }


            // =========================================================
            // UPDATE PAYIN
            // =========================================================

            payiis.Result =
                result.Status;

            payiis.Status =
                isCharged;

            payiis.Amount =
                result.Amount;

            payiis.CardBrand = result.Card.JuspayBankCode;
            payiis.BankName = result.Card.CardBrand;
            payiis.CardType = result.Card.CardType + "-" + result.Card.CardSubTypeCategory;
            payiis.CardNo = result.Card.LastFourDigits;

            payiis.PayInCommission =
                isCharged
                    ? (result.Amount * payInLimit / 100)
                    : 0;


            _db.fPayIns.Update(payiis);


            // =========================================================
            // SAVE DATABASE
            // =========================================================

            await _db.SaveChangesAsync();


            // =========================================================
            // RETURN HDFC RESPONSE
            // =========================================================


            // =====================================================
            // PAYMENT SUCCESS
            // =====================================================

            if (isCharged)
            {
                // IMPORTANT:
                // Check whether passbook entry already exists
                // for this transaction.
                var existingHistory = await _db.fPassbookHistories
                    .FirstOrDefaultAsync(t =>
                        t.TxnId == payiis.TaxNumber);

                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);


                if (existingHistory == null)
                {
                    decimal balance = await _dataUtils.GetWalletAmount(
                        payiis.UserPhone
                    );

                    var history = new FPassbookHistory
                    {
                        UserId = user.Id,
                        UserPhone = user.UserPhone,
                        Name = payiis.CardHolderName,

                        TxnId = payiis.TaxNumber,

                        AccountNumber = payiis.CardHolderCardNumber,

                        Amount = payiis.Amount,

                        TransactionType = "PayIn",

                        Status = true,

                        StatusMessage = payiis.Result,

                        ParentId = payiis.Id,

                        Balance = balance,

                        CreatedAt = istNow
                    };

                    await _db.fPassbookHistories.AddAsync(history);

                    await _db.SaveChangesAsync();
                }
            }


            return result;
        }


        private static decimal ExtractPayInMargin(FUserLookup? lookup, string cardType)
        {
            decimal margin = 0;
            if (lookup != null && !string.IsNullOrEmpty(lookup.LookupJson))
            {
                var settings = JsonSerializer.Deserialize<Dictionary<string, object>>(lookup.LookupJson);
                if (settings != null && settings.TryGetValue("HEducation PayIn Margin", out var value))
                {
                    if (value is JsonElement element)
                    {
                        if (element.ValueKind == JsonValueKind.String)
                            decimal.TryParse(element.GetString(), out margin);
                        else if (element.ValueKind == JsonValueKind.Number)
                            margin = element.GetDecimal();
                    }
                }
            }

            if (string.Equals(cardType, "business", StringComparison.OrdinalIgnoreCase))
            {
                margin = 3.6m;
            }

            return margin;
        }

    }

    public class HdfcOrderStatusResponse
    {
        [JsonPropertyName("customer_email")]
        public string? CustomerEmail { get; set; }

        [JsonPropertyName("customer_phone")]
        public string? CustomerPhone { get; set; }

        [JsonPropertyName("customer_id")]
        public string? CustomerId { get; set; }

        [JsonPropertyName("customer_phone_country_code")]
        public string? CustomerPhoneCountryCode { get; set; }

        [JsonPropertyName("status_id")]
        public int? StatusId { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("merchant_id")]
        public string? MerchantId { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("currency")]
        public string? Currency { get; set; }

        [JsonPropertyName("order_id")]
        public string? OrderId { get; set; }

        [JsonPropertyName("date_created")]
        public DateTime? DateCreated { get; set; }

        [JsonPropertyName("last_updated")]
        public DateTime? LastUpdated { get; set; }

        [JsonPropertyName("return_url")]
        public string? ReturnUrl { get; set; }

        [JsonPropertyName("product_id")]
        public string? ProductId { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("payment_links")]
        public HdfcPaymentLinks? PaymentLinks { get; set; }

        [JsonPropertyName("udf1")]
        public string? Udf1 { get; set; }

        [JsonPropertyName("udf2")]
        public string? Udf2 { get; set; }

        [JsonPropertyName("udf3")]
        public string? Udf3 { get; set; }

        [JsonPropertyName("udf4")]
        public string? Udf4 { get; set; }

        [JsonPropertyName("udf5")]
        public string? Udf5 { get; set; }

        [JsonPropertyName("udf6")]
        public string? Udf6 { get; set; }

        [JsonPropertyName("udf7")]
        public string? Udf7 { get; set; }

        [JsonPropertyName("udf8")]
        public string? Udf8 { get; set; }

        [JsonPropertyName("udf9")]
        public string? Udf9 { get; set; }

        [JsonPropertyName("udf10")]
        public string? Udf10 { get; set; }

        [JsonPropertyName("txn_id")]
        public string? TxnId { get; set; }

        [JsonPropertyName("payment_method_type")]
        public string? PaymentMethodType { get; set; }

        [JsonPropertyName("auth_type")]
        public string? AuthType { get; set; }

        [JsonPropertyName("card")]
        public HdfcCard? Card { get; set; }

        [JsonPropertyName("payment_method")]
        public string? PaymentMethod { get; set; }

        [JsonPropertyName("refunded")]
        public bool Refunded { get; set; }

        [JsonPropertyName("amount_refunded")]
        public decimal AmountRefunded { get; set; }

        [JsonPropertyName("effective_amount")]
        public decimal EffectiveAmount { get; set; }

        [JsonPropertyName("resp_code")]
        public string? RespCode { get; set; }

        [JsonPropertyName("resp_message")]
        public string? RespMessage { get; set; }

        [JsonPropertyName("bank_error_code")]
        public string? BankErrorCode { get; set; }

        [JsonPropertyName("bank_error_message")]
        public string? BankErrorMessage { get; set; }

        [JsonPropertyName("txn_uuid")]
        public string? TxnUuid { get; set; }

        [JsonPropertyName("txn_detail")]
        public HdfcTxnDetail? TxnDetail { get; set; }

        [JsonPropertyName("payment_gateway_response")]
        public HdfcPaymentGatewayResponse? PaymentGatewayResponse { get; set; }

        [JsonPropertyName("gateway_id")]
        public int? GatewayId { get; set; }

        [JsonPropertyName("emi_details")]
        public HdfcEmiDetails? EmiDetails { get; set; }

        [JsonPropertyName("metadata")]
        public HdfcMetadata? Metadata { get; set; }

        [JsonPropertyName("gateway_reference_id")]
        public string? GatewayReferenceId { get; set; }

        [JsonPropertyName("offers")]
        public List<object>? Offers { get; set; }

        [JsonPropertyName("maximum_eligible_refund_amount")]
        public decimal MaximumEligibleRefundAmount { get; set; }

        [JsonPropertyName("order_expiry")]
        public DateTime? OrderExpiry { get; set; }

        [JsonPropertyName("resp_category")]
        public string? RespCategory { get; set; }

        [JsonPropertyName("next_action")]
        public List<string>? NextAction { get; set; }
    }

    public class HdfcPaymentLinks
    {
        [JsonPropertyName("iframe")]
        public string? Iframe { get; set; }

        [JsonPropertyName("mobile")]
        public string? Mobile { get; set; }

        [JsonPropertyName("web")]
        public string? Web { get; set; }
    }

    public class HdfcCard
    {
        [JsonPropertyName("expiry_year")]
        public string? ExpiryYear { get; set; }

        [JsonPropertyName("card_reference")]
        public string? CardReference { get; set; }

        [JsonPropertyName("saved_to_locker")]
        public bool SavedToLocker { get; set; }

        [JsonPropertyName("expiry_month")]
        public string? ExpiryMonth { get; set; }

        [JsonPropertyName("name_on_card")]
        public string? NameOnCard { get; set; }

        [JsonPropertyName("card_issuer")]
        public string? CardIssuer { get; set; }

        [JsonPropertyName("last_four_digits")]
        public string? LastFourDigits { get; set; }

        [JsonPropertyName("using_saved_card")]
        public bool UsingSavedCard { get; set; }

        [JsonPropertyName("card_fingerprint")]
        public string? CardFingerprint { get; set; }

        [JsonPropertyName("card_isin")]
        public string? CardIsin { get; set; }

        [JsonPropertyName("card_type")]
        public string? CardType { get; set; }

        [JsonPropertyName("card_brand")]
        public string? CardBrand { get; set; }

        [JsonPropertyName("using_token")]
        public bool UsingToken { get; set; }

        [JsonPropertyName("tokens")]
        public List<object>? Tokens { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }

        [JsonPropertyName("card_issuer_country")]
        public string? CardIssuerCountry { get; set; }

        [JsonPropertyName("juspay_bank_code")]
        public string? JuspayBankCode { get; set; }

        [JsonPropertyName("extended_card_type")]
        public string? ExtendedCardType { get; set; }

        [JsonPropertyName("payment_account_reference")]
        public string? PaymentAccountReference { get; set; }

        [JsonPropertyName("card_sub_type_category")]
        public string? CardSubTypeCategory { get; set; }
    }

    public class HdfcTxnDetail
    {
        [JsonPropertyName("txn_id")]
        public string? TxnId { get; set; }

        [JsonPropertyName("order_id")]
        public string? OrderId { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("error_code")]
        public string? ErrorCode { get; set; }

        [JsonPropertyName("net_amount")]
        public decimal? NetAmount { get; set; }

        [JsonPropertyName("surcharge_amount")]
        public decimal? SurchargeAmount { get; set; }

        [JsonPropertyName("tax_amount")]
        public decimal? TaxAmount { get; set; }

        [JsonPropertyName("txn_amount")]
        public decimal? TxnAmount { get; set; }

        [JsonPropertyName("offer_deduction_amount")]
        public decimal? OfferDeductionAmount { get; set; }

        [JsonPropertyName("gateway_id")]
        public int? GatewayId { get; set; }

        [JsonPropertyName("merchant_identifier")]
        public string? MerchantIdentifier { get; set; }

        [JsonPropertyName("currency")]
        public string? Currency { get; set; }

        [JsonPropertyName("metadata")]
        public Dictionary<string, object>? Metadata { get; set; }

        [JsonPropertyName("express_checkout")]
        public bool ExpressCheckout { get; set; }

        [JsonPropertyName("redirect")]
        public bool Redirect { get; set; }

        [JsonPropertyName("txn_uuid")]
        public string? TxnUuid { get; set; }

        [JsonPropertyName("gateway")]
        public string? Gateway { get; set; }

        [JsonPropertyName("error_message")]
        public string? ErrorMessage { get; set; }

        [JsonPropertyName("created")]
        public DateTime? Created { get; set; }

        [JsonPropertyName("last_updated")]
        public DateTime? LastUpdated { get; set; }

        [JsonPropertyName("txn_flow_type")]
        public string? TxnFlowType { get; set; }

        [JsonPropertyName("is_cvv_less_txn")]
        public bool IsCvvLessTxn { get; set; }

        [JsonPropertyName("txn_amount_breakup")]
        public List<HdfcTxnAmountBreakup>? TxnAmountBreakup { get; set; }
    }

    public class HdfcTxnAmountBreakup
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("sno")]
        public int Sno { get; set; }

        [JsonPropertyName("method")]
        public string? Method { get; set; }
    }

    public class HdfcPaymentGatewayResponse
    {
        [JsonPropertyName("resp_code")]
        public string? RespCode { get; set; }

        [JsonPropertyName("rrn")]
        public string? Rrn { get; set; }

        [JsonPropertyName("created")]
        public DateTime? Created { get; set; }

        [JsonPropertyName("epg_txn_id")]
        public string? EpgTxnId { get; set; }

        [JsonPropertyName("resp_message")]
        public string? RespMessage { get; set; }

        [JsonPropertyName("auth_id_code")]
        public string? AuthIdCode { get; set; }

        [JsonPropertyName("txn_id")]
        public string? TxnId { get; set; }

        [JsonPropertyName("network_error_message")]
        public string? NetworkErrorMessage { get; set; }

        [JsonPropertyName("network_error_code")]
        public string? NetworkErrorCode { get; set; }

        [JsonPropertyName("arn")]
        public string? Arn { get; set; }

        [JsonPropertyName("gateway_merchant_id")]
        public string? GatewayMerchantId { get; set; }

        [JsonPropertyName("eci")]
        public string? Eci { get; set; }

        [JsonPropertyName("auth_ref_num")]
        public string? AuthRefNum { get; set; }

        [JsonPropertyName("umrn")]
        public string? Umrn { get; set; }

        [JsonPropertyName("current_blocked_amount")]
        public decimal? CurrentBlockedAmount { get; set; }

        [JsonPropertyName("payer_ifsc")]
        public string? PayerIfsc { get; set; }

        [JsonPropertyName("payer_name")]
        public string? PayerName { get; set; }

        [JsonPropertyName("payer_account")]
        public string? PayerAccount { get; set; }

        [JsonPropertyName("payer_account_type")]
        public string? PayerAccountType { get; set; }

        [JsonPropertyName("xid")]
        public string? Xid { get; set; }

        [JsonPropertyName("cvv_check")]
        public string? CvvCheck { get; set; }

        [JsonPropertyName("avs_response")]
        public string? AvsResponse { get; set; }

        [JsonPropertyName("masked_bank_account_number")]
        public string? MaskedBankAccountNumber { get; set; }
    }

    public class HdfcEmiDetails
    {
        [JsonPropertyName("conversion_details")]
        public object? ConversionDetails { get; set; }

        [JsonPropertyName("monthly_payment")]
        public decimal? MonthlyPayment { get; set; }

        [JsonPropertyName("emi_type")]
        public string? EmiType { get; set; }

        [JsonPropertyName("tenure")]
        public int? Tenure { get; set; }

        [JsonPropertyName("interest")]
        public decimal? Interest { get; set; }

        [JsonPropertyName("processed_by")]
        public string? ProcessedBy { get; set; }

        [JsonPropertyName("additional_processing_fee_info")]
        public object? AdditionalProcessingFeeInfo { get; set; }

        [JsonPropertyName("subvention_info")]
        public List<object>? SubventionInfo { get; set; }

        [JsonPropertyName("bank")]
        public string? Bank { get; set; }

        [JsonPropertyName("principal_amount")]
        public decimal? PrincipalAmount { get; set; }

        [JsonPropertyName("subvention_amount")]
        public decimal? SubventionAmount { get; set; }
    }

    public class HdfcMetadata
    {
        [JsonPropertyName("payment_page_sdk_payload")]
        public string? PaymentPageSdkPayload { get; set; }

        [JsonPropertyName("payment_links")]
        public HdfcPaymentLinks? PaymentLinks { get; set; }

        [JsonPropertyName("order_expiry")]
        public DateTime? OrderExpiry { get; set; }

        [JsonPropertyName("payment_page_client_id")]
        public string? PaymentPageClientId { get; set; }

        [JsonPropertyName("merchant_payload")]
        public string? MerchantPayload { get; set; }
    }
}

