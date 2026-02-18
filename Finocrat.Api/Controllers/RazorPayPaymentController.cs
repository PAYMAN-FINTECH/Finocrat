using Finocrat.Api.Data;
using Finocrat.Api.Helpers;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Razorpay.Api;
using System.Security.Cryptography;
using System.Text;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RazorPayPaymentController : ControllerBase
    {
        //private const string RAZORPAY_KEY = "rzp_test_SAyyJpAwngeELw";
        //private const string RAZORPAY_SECRET = "8Au83rntX9vQslAlgM4Z9NiB";

        private const string RAZORPAY_KEY = "rzp_live_SAywFmrElCuSJH";
        private const string RAZORPAY_SECRET = "oQmy8qIa09hGxop7d05f3Pex";

        private readonly FinocratDbContext _db;
        private readonly DataUtils _dataUtils;
        public RazorPayPaymentController(FinocratDbContext db, DataUtils dataUtils)
        {
            _db = db;
            _dataUtils = dataUtils;
        }


        [HttpGet("gateways")]
        public IActionResult GetGateways()
        
        {
            return Ok(new[]
            {
        new { id = 1, name = "REducation" }
    });
        }


        // CREATE ORDER
        [HttpPost("create-order")]
        public IActionResult CreateOrder([FromBody] OrderRequest model)
        {
            var client = new RazorpayClient(RAZORPAY_KEY, RAZORPAY_SECRET);

            var options = new Dictionary<string, object>
        {
            { "amount", model.Amount * 100 },
            { "currency", "INR" },
            { "receipt", Guid.NewGuid().ToString() },
            { "payment_capture", 1 }
        };

            var order = client.Order.Create(options);

            return Ok(new
            {
                orderId = order["id"].ToString(),
                amount = model.Amount,
                key = RAZORPAY_KEY
            });
        }

        // VERIFY PAYMENT
        [HttpPost("verify")]
        public IActionResult VerifyPayment([FromBody] VerifyPaymentRequest model)
        {
            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

            string payload =
                model.OrderId + "|" + model.PaymentId;

            string generatedSignature = GenerateSignature(payload, RAZORPAY_SECRET);
            var client = new RazorpayClient(RAZORPAY_KEY, RAZORPAY_SECRET);

            var order = client.Order.Fetch(model.OrderId);
            var payment = client.Payment.Fetch(model.PaymentId);
            var razorPayCard = client.Card.FetchCardDetails(model.PaymentId);

            var userdetails = _db.fUsers.FirstOrDefault(t => t.UserPhone == model.LoggedInUserPhone);

            

            if (generatedSignature == model.Signature)
            {
                if (userdetails != null)
                {
                    var payIns = new FPayIn
                    {
                        UserId = userdetails.Id,
                        UserPhone = model.LoggedInUserPhone,
                        UserEmail = userdetails.Email,
                        CardHolderName = model.CardHolderName,
                        CardHolderPhone = model.Mobile,
                        CardHolderEmail = model.CardHolderMail,
                        CardHolderCardNumber = model.CardHolderCard,
                        Result = payment["status"],
                        CardBrand = razorPayCard["issuer"] ?? "",
                        BankName = razorPayCard["network"] ?? "",// razorPayCard["sub_type"]
                        CardType = razorPayCard["sub_type"] ?? "",
                        Status = payment["status"] == "captured",
                        CardNo = razorPayCard["last4"] ?? "",
                        PaymentId = model.PaymentId,
                        TaxNumber = model.OrderId,
                        Amount = model.Amount,
                        PayInCommission = model.Amount / 100,
                        FCommission = model.Amount / 100,
                        Gateway = model.SelectedGateway,
                        Created = istNow
                    };

                    var res = _dataUtils.InsertAsync(payIns);
                }
               
                // ✅ SAVE SUCCESS PAYMENT IN DB HERE
                return Ok(new { status = "SUCCESS" });
            }

            return BadRequest(new { status = "FAILED" });
        }

        private static string GenerateSignature(string payload, string secret)
        {
            byte[] secretBytes = Encoding.UTF8.GetBytes(secret);
            using var hmac = new HMACSHA256(secretBytes);
            byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);
            byte[] hash = hmac.ComputeHash(payloadBytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    }

    public class OrderRequest
    {
        public decimal Amount { get; set; }
    }

    public class VerifyPaymentRequest
    {
        public string OrderId { get; set; }
        public string PaymentId { get; set; }
        public string Signature { get; set; }

        public decimal Amount { get; set; }
        public string Mobile { get; set; }
        public string SelectedGateway { get; set; }
        public string LoggedInUserPhone { get; set; }
        public string CardHolderName { get; set; }
        public string CardHolderMail { get; set; }
        public string CardHolderCard { get; set; }
    }
}
