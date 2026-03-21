using Newtonsoft.Json;

namespace Finocrat.Api.Models.DTOs.MainDtos
{
    public class CCDto
    {
    }

    public class BalanceResponse
    {
        public BalanceData Data { get; set; }
    }

    public class BalanceData
    {
        public BalanceDetails Balance { get; set; }
    }

    public class BalanceDetails
    {
        public string Available { get; set; }
    }

    public class BillerResponse
    {
        [JsonProperty("statuscode")]
        public string Statuscode { get; set; }

        [JsonProperty("actcode")]
        public string Actcode { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; }

        [JsonProperty("data")]
        public BillerData Data { get; set; }

        [JsonProperty("timestamp")]
        public string Timestamp { get; set; }

        [JsonProperty("ipay_uuid")]
        public string Ipay_uuid { get; set; }

        [JsonProperty("orderid")]
        public string Orderid { get; set; }

        [JsonProperty("environment")]
        public string Environment { get; set; }

        [JsonProperty("internalCode")]
        public string InternalCode { get; set; }
    }

    public class BillerData
    {
        [JsonProperty("meta")]
        public MetaData Meta { get; set; }

        [JsonProperty("records")]
        public List<BillerRecord> Records { get; set; }
    }

    public class MetaData
    {
        [JsonProperty("totalPages")]
        public int TotalPages { get; set; }

        [JsonProperty("currentPage")]
        public int CurrentPage { get; set; }

        [JsonProperty("totalRecords")]
        public int TotalRecords { get; set; }

        [JsonProperty("recordsOnCurrentPage")]
        public int RecordsOnCurrentPage { get; set; }

        [JsonProperty("recordFrom")]
        public int RecordFrom { get; set; }

        [JsonProperty("recordTo")]
        public int RecordTo { get; set; }
    }

    public class BillerRecord
    {
        [JsonProperty("billerId")]
        public string BillerId { get; set; }

        [JsonProperty("billerName")]
        public string BillerName { get; set; }

        [JsonProperty("categoryKey")]
        public string CategoryKey { get; set; }

        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("categoryName")]
        public string CategoryName { get; set; }

        [JsonProperty("coverageCity")]
        public string CoverageCity { get; set; }

        [JsonProperty("coverageState")]
        public string CoverageState { get; set; }

        [JsonProperty("coveragePincode")]
        public int CoveragePincode { get; set; }

        [JsonProperty("updatedDate")]
        public string UpdatedDate { get; set; }

        [JsonProperty("billerStatus")]
        public string BillerStatus { get; set; }

        [JsonProperty("isAvailable")]
        public bool IsAvailable { get; set; }

        [JsonProperty("iconUrl")]
        public string IconUrl { get; set; }

        // local field (not from API)
        public string UserPhone { get; set; }
    }

    public class BillRequestApp
    {
        public string RegisteredMobile { get; set; }
        public string CreditCardLast4 { get; set; }
        public string CustomerMobile { get; set; }
        public string BillerId { get; set; }
        public string UserPhone { get; set; }
        public string ServiceNumber { get; set; }
        public string Category { get; set; }
    }

    public class BillInstantPayResponse
    {
        public string StatusCode { get; set; }
        public string ActCode { get; set; }
        public string Status { get; set; }
        public BillData1 Data { get; set; }
    }

    public class BillData1
    {
        public string EnquiryReferenceId { get; set; }
        public string CustomerName { get; set; }
        public string BillNumber { get; set; }
        public string BillPeriod { get; set; }
        public string BillDate { get; set; }
        public string BillDueDate { get; set; }
        public string BillAmount { get; set; }

        public List<CustomerParamDetail1> CustomerParamsDetails { get; set; }
        public List<BillDetail1> BillDetails { get; set; }
        public List<AdditionalDetail1> AdditionalDetails { get; set; }
    }

    public class CustomerParamDetail1
    {
        public string Name { get; set; }
        public string Value { get; set; }
    }

    public class BillDetail1
    {
        public string Name { get; set; }
        public string Value { get; set; }
    }

    public class AdditionalDetail1
    {
        public string Name { get; set; }
        public string Value { get; set; }
    }

    public class BillerResponse11
    {
        public string StatusCode { get; set; }
        public string ActCode { get; set; }
        public string Status { get; set; }
        public BillerData11 Data { get; set; }
    }

    public class BillerData11
    {
        public List<PaymentMode> PaymentModes { get; set; }
        public List<Parameter> Parameters { get; set; }
    }

    public class PaymentMode
    {
        public string Name { get; set; }
    }

    public class Parameter
    {
        public string Name { get; set; }
        public int MinLength { get; set; }
        public int MaxLength { get; set; }
    }

    public class BillResponseApp
    {
        public bool Success { get; set; }
        public string Message { get; set; }

        // Bill Details
        public string ConsumerName { get; set; }
        public string BillNumber { get; set; }
        public string BillDate { get; set; }
        public string DueDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal MinPayable { get; set; }
        public decimal CuurentOutStanding { get; set; }
        public string PaymentMode { get; set; }
        public string Param1 { set; get; }
        public string Param2 { set; get; }
        public string EnquiryReferenceId { get; set; }

        //Bill Avenue params

        public string BillerId { get; set; }

        public string BillerResponse { get; set; }
        public string AdddditionalInfo { get; set; }
        public string BillFetchResponse { get; set; }
        public string CustomerType { get; set; }


    }

    public class PaymentRequestApp
    {
        public string BillerId { get; set; }
        public string CustomerMobile { get; set; }
        public decimal Amount { get; set; }
        public string Phone { get; set; }
        public string PaymentMode { get; set; }
        public string EnquiryReferenceId { get; set; }
        public string Param1 { get; set; }
        public string Param2 { get; set; }
        public string LastFourDigits { get; set; }
        public string customerName { get; set; }
        public string holderMobile { get; set; }
        public string Device { get; set; }
    }

    public class TransactionResponse
    {
        public string StatusCode { get; set; }
        public string ActCode { get; set; }
        public string Status { get; set; }
        public TransactionData Data { get; set; }
    }

    public class TransactionData
    {
        public string ExternalRef { get; set; }
        public string PoolReferenceId { get; set; }
        public string TxnReferenceId { get; set; }

        public PoolDetails Pool { get; set; }
        public BillerDetails BillerDetails { get; set; }
        public BillDetails BillDetails { get; set; }
    }

    public class PoolDetails
    {
        public string Account { get; set; }
        public string OpeningBal { get; set; }
        public string Mode { get; set; }
        public string Amount { get; set; }
        public string ClosingBal { get; set; }
    }

    public class BillerDetails
    {
        public string Name { get; set; }
        public string Account { get; set; }
    }

    public class BillDetails
    {
        public string CustomerName { get; set; }
        public string BillNumber { get; set; }
        public string BillPeriod { get; set; }
        public string BillDate { get; set; }
        public string BillDueDate { get; set; }
        public string BillAmount { get; set; }
        public List<CustomerParamDetail> CustomerParamsDetails { get; set; }
        public string AdditionalDetails { get; set; }
    }

    public class CustomerParamDetail
    {
        public string Name { get; set; }
        public string Value { get; set; }
    }

    public class PaymentResponseProcess
    {
        public bool Success { get; set; }
        public string Amount { get; set; }
        public string OrderId { get; set; }
        public string ReferenceId { get; set; }
        public string Category { get; set; }
        public string BillerName { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
        public string UserPhone { get; set; }
        public string UserName { get; set; }
    }

    public class InstantPaySignupRequest
    {
        public string Mobile { get; set; }
        public string Email { get; set; }
        public string Aadhaar { get; set; }   // Plain Aadhaar
        public string Pan { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public string Consent { get; set; }
    }

    public class InstantPayValidateRequest
    {
        public string OtpReferenceID { get; set; }
        public string Otp { get; set; }
        public string Hash { get; set; }
    }
}
