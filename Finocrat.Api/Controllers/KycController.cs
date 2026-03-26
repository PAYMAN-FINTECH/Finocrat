using Finocrat.Api.Data;
using Finocrat.Api.Models;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Text;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KycController : ControllerBase
    {
        private readonly FinocratDbContext _context;
        private readonly IConfiguration _config;

        public KycController(FinocratDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        private string ClientId => _config["Cashfree:ClientId"];
        private string ClientSecret => _config["Cashfree:ClientSecret"];

        // =========================================
        // 1. SEND AADHAAR OTP
        // =========================================
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendAadhaarOtp([FromBody] AdharNumberRequest request)
        {
            if (string.IsNullOrEmpty(request.AdharNumber))
                return BadRequest("Aadhaar required");

            var user = await _context.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == request.Phone);
            var kyc = await _context.FKycDetails
                .FirstOrDefaultAsync(x => x.Phone == request.Phone);

            if (user == null)
                return BadRequest("User not found");

            if (kyc.IsKycCompleted)
                return BadRequest("Aadhaar already verified");

            var url = "https://api.cashfree.com/verification/offline-aadhaar/otp";

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("x-client-id", ClientId);
            client.DefaultRequestHeaders.Add("x-client-secret", ClientSecret);

            var payload = new { aadhaar_number = request.AdharNumber };

            var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
                return BadRequest("OTP failed");

            var result = JsonConvert.DeserializeObject<dynamic>(
                await response.Content.ReadAsStringAsync()
            );

            var refId = (string)result.ref_id;

            var existing = await _context.fAadharDetails
                .FirstOrDefaultAsync(x => x.Phone == request.Phone);

            if (existing == null)
            {
                _context.fAadharDetails.Add(new FAadharDetails
                {
                    UserId = user.Id,
                    Phone = request.Phone,
                    AadharNo = request.AdharNumber,
                    AadharRefId = refId,
                    Otp = "",
                    Name = "",
                    Address = "",
                    Status = false,
                    Created = DateTime.Now,
                    Updated = DateTime.Now
                });
            }
            else
            {
                existing.AadharNo = request.AdharNumber;
                existing.AadharRefId = refId;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, refId });
        }

        // =========================================
        // 2. VERIFY OTP
        // =========================================
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyAdharOtpRequest request)
        {
            var adhar = await _context.fAadharDetails
                .FirstOrDefaultAsync(x => x.Phone == request.Phone);

            if (adhar == null)
                return BadRequest("OTP not initiated");

            var url = "https://api.cashfree.com/verification/offline-aadhaar/verify";

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("x-client-id", ClientId);
            client.DefaultRequestHeaders.Add("x-client-secret", ClientSecret);

            var payload = new
            {
                otp = request.Otp,
                ref_id = request.RefId
            };

            var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
                return BadRequest("OTP verification failed");

            var result = JsonConvert.DeserializeObject<dynamic>(
                await response.Content.ReadAsStringAsync()
            );

            if (result.status == "VALID")
            {
                adhar.Status = true;
                adhar.Otp = request.Otp;
                adhar.Name = result.name;
                adhar.Address = result.address;

                var user = await _context.fUsers
                    .FirstOrDefaultAsync(x => x.UserPhone == request.Phone);


                await _context.SaveChangesAsync();

                return Ok(new { success = true });
            }

            return BadRequest("Invalid OTP");
        }

        // =========================================
        // 3. VERIFY PAN
        // =========================================
        [HttpPost("verify-pan")]
        public async Task<IActionResult> VerifyPan([FromBody] PanRequest request)
        {
            var url = "https://api.cashfree.com/verification/pan";

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("x-client-id", ClientId);
            client.DefaultRequestHeaders.Add("x-client-secret", ClientSecret);

            var payload = new { pan = request.PanNumber };

            var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
                return BadRequest("PAN failed");

            var result = JsonConvert.DeserializeObject<dynamic>(
                await response.Content.ReadAsStringAsync()
            );

            if (result.valid == true)
            {
                var doc = await _context.fUserDocuments
                    .FirstOrDefaultAsync(x => x.Phone == request.Phone);

                if (doc == null)
                {
                    doc = new FUserDocuments
                    {
                        Phone = request.Phone,
                        PanCardNumber = request.PanNumber
                    };
                    _context.fUserDocuments.Add(doc);
                }
                else
                {
                    doc.PanCardNumber = request.PanNumber;
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, name = result.name });
            }

            return BadRequest("Invalid PAN");
        }

        // =========================================
        // 4. UPLOAD DOCS
        // =========================================
        [HttpPost("upload-docs")]
        public async Task<IActionResult> UploadDocs(
            IFormFile aadhaarFront,
            IFormFile aadhaarBack,
            IFormFile panFile,
            string phone)
        {
            var doc = await _context.fUserDocuments
                .FirstOrDefaultAsync(x => x.Phone == phone);

            if (doc == null)
            {
                doc = new Models.Entities.Main.FUserDocuments { Phone = phone };
                _context.fUserDocuments.Add(doc);
            }

            doc.AadharFront = await ConvertToBytes(aadhaarFront);
            doc.AadharBack = await ConvertToBytes(aadhaarBack);
            doc.PanCard = await ConvertToBytes(panFile);
            doc.UploadedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // =========================================
        // 5. FINAL SUBMIT
        // =========================================
        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] FinalKycRequest req)
        {
            var user = await _context.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == req.Phone);

            var kyc = await _context.FKycDetails
                .FirstOrDefaultAsync(x => x.Phone == req.Phone);

            if (user == null)
                return BadRequest("User not found");

            if (!kyc.IsAadharVerified)
                return BadRequest("Complete Aadhaar first");

            kyc.IsKycCompleted = true;

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // =========================================
        private async Task<byte[]> ConvertToBytes(IFormFile file)
        {
            if (file == null) return null;

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            return ms.ToArray();
        }
    }
    public class AdharNumberRequest
    {
        public string Phone { get; set; }
        public string AdharNumber { get; set; }
    }
    public class VerifyAdharOtpRequest
    {
        public string Phone { get; set; }
        public string Otp { get; set; }
        public string RefId { get; set; }
    }

    public class PanRequest
    {
        public string Phone { get; set; }
        public string PanNumber { get; set; }
    }
    public class FinalKycRequest
    {
        public string Phone { get; set; }
    }


}
