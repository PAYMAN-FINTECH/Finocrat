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
        private const string RAZORPAY_KEY = "rzp_test_SAyyJpAwngeELw";
        private const string RAZORPAY_SECRET = "8Au83rntX9vQslAlgM4Z9NiB";

        [HttpGet("gateways")]
        public IActionResult GetGateways()
        {
            return Ok(new[]
            {
        new { id = 1, name = "Education" },
        new { id = 2, name = "Travel" }
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
                orderId = order["id"],
                amount = model.Amount,
                key = RAZORPAY_KEY
            });
        }

        // VERIFY PAYMENT
        [HttpPost("verify")]
        public IActionResult VerifyPayment([FromBody] VerifyPaymentRequest model)
        {
            string payload =
                model.OrderId + "|" + model.PaymentId;

            string generatedSignature = GenerateSignature(payload, RAZORPAY_SECRET);

            if (generatedSignature == model.Signature)
            {
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
    }
}
