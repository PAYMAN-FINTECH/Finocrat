using Finocrat.Api.Data;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Net.NetworkInformation;
using System.Text.Json;
using System.Net.Http.Headers;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HdfcPaymentController : ControllerBase
    {
        private readonly HdfcSmartGatewayService _hdfcService;

        public HdfcPaymentController(
            HdfcSmartGatewayService hdfcService)
        {
            _hdfcService = hdfcService;
        }

        // =========================================================
        // CREATE PAYMENT
        // =========================================================

        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment(
            [FromBody] HdfcCreatePaymentRequest request)
        {
            try
            {
                // -------------------------------------------------
                // Validation
                // -------------------------------------------------

                if (request.Amount <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Amount must be greater than zero."
                    });
                }


                if (string.IsNullOrWhiteSpace(
                    request.CustomerId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Customer ID is required."
                    });
                }


                if (string.IsNullOrWhiteSpace(
                    request.CustomerEmail))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Customer email is required."
                    });
                }


                if (string.IsNullOrWhiteSpace(
                    request.CustomerPhone))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Customer phone is required."
                    });
                }


                // -------------------------------------------------
                // Generate unique order ID
                // -------------------------------------------------

                var orderId =
                    "FINO_" +
                    DateTime.UtcNow
                        .ToString("yyyyMMddHHmmssfff");

                


                // -------------------------------------------------
                // Call HDFC
                // -------------------------------------------------

                var hdfcResponse =
                    await _hdfcService
                        .CreateSessionAsync(
                            orderId,
                            request.Amount,
                            request.CustomerId,
                            request.CustomerEmail,
                            request.CustomerPhone,
                            request.FirstName,
                            request.LastName,
                            request.LoggedInUserPhone,
                            request.cardnum,
                            request.SelectedGateway);


                // -------------------------------------------------
                // Extract payment_links.web
                // -------------------------------------------------

                string? paymentUrl = null;


                if (hdfcResponse.TryGetProperty(
                    "payment_links",
                    out JsonElement paymentLinks))
                {
                    if (paymentLinks.TryGetProperty(
                        "web",
                        out JsonElement web))
                    {
                        paymentUrl =
                            web.GetString();
                    }
                }


                if (string.IsNullOrWhiteSpace(
                    paymentUrl))
                {
                    return StatusCode(
                        502,
                        new
                        {
                            success = false,

                            message =
                                "HDFC did not return payment_links.web.",

                            hdfcResponse
                        });
                }


                // -------------------------------------------------
                // TODO:
                //
                // Save orderId, amount, customer information
                // and paymentUrl in your Finocrat database here.
                //
                // Example:
                //
                // Status = "INITIATED"
                // -------------------------------------------------


                return Ok(new
                {
                    success = true,

                    orderId = orderId,

                    amount = request.Amount,

                    paymentUrl = paymentUrl,

                    status = "INITIATED"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        success = false,

                        message =
                            "Unable to create HDFC payment.",

                        error = ex.Message
                    });
            }
        }


        
        [HttpPost("response")]
        public async Task<IActionResult> PaymentResponse()
        {
            try
            {
                using var reader =
                    new StreamReader(Request.Body);

                var body =
                    await reader.ReadToEndAsync();


                if (string.IsNullOrWhiteSpace(body))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Empty SmartGateway response."
                    });
                }


                // -----------------------------------------------------
                // Parse application/x-www-form-urlencoded
                // -----------------------------------------------------

                var parameters =
                    Microsoft.AspNetCore.WebUtilities
                        .QueryHelpers
                        .ParseQuery(body);


                var orderId =
                    parameters["order_id"]
                        .FirstOrDefault() ?? "";

                var status =
                    parameters["status"]
                        .FirstOrDefault() ?? "";

                var statusId =
                    parameters["status_id"]
                        .FirstOrDefault() ?? "";

                var signature =
                    parameters["signature"]
                        .FirstOrDefault() ?? "";

                var signatureAlgorithm =
                    parameters["signature_algorithm"]
                        .FirstOrDefault() ?? "";



                if (string.IsNullOrWhiteSpace(orderId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "order_id not received."
                    });
                }


                // -----------------------------------------------------
                // GET CUSTOMER ID FROM YOUR DATABASE
                // -----------------------------------------------------

                //var transaction =
                //    await _transactionService
                //        .GetByOrderIdAsync(orderId);


                //if (transaction == null)
                //{
                //    return NotFound(new
                //    {
                //        success = false,
                //        message =
                //            $"Transaction not found for order_id: {orderId}"
                //    });
                //}


                var customerId = "testing-customer-one1";


                if (string.IsNullOrWhiteSpace(customerId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "CustomerId is missing for this transaction."
                    });
                }

                // -----------------------------------------------------
                // CALL HDFC ORDER STATUS
                // -----------------------------------------------------

                var orderStatus =
                    await _hdfcService
                        .GetOrderStatusAsync(
                            orderId,
                            customerId);


                // -----------------------------------------------------
                // GET FINAL STATUS
                // -----------------------------------------------------

                string finalStatus = orderStatus.Status;


                


                // -----------------------------------------------------
                // CHARGED
                // -----------------------------------------------------

                if (finalStatus.Equals(
                        "CHARGED",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Redirect(
                         "https://thefinocrat.com/app/finhome"
                         + "?payment=success"
                         + $"&order_id={Uri.EscapeDataString(orderId)}"
                     );
                }


                // -----------------------------------------------------
                // FAILED
                // -----------------------------------------------------

                if (finalStatus.Equals(
                        "FAILED",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Redirect(
                    "https://thefinocrat.com/app/finhome"
                    + "?payment=failed"
                    + $"&order_id={Uri.EscapeDataString(orderId)}"
                    );
                }


                // -----------------------------------------------------
                // PENDING / OTHER
                // -----------------------------------------------------

                return Redirect(
                    "https://thefinocrat.com/app/finhome"
                    + "?payment=failed"
                    + $"&order_id={Uri.EscapeDataString(orderId)}"
                    );
            }
            catch (Exception ex)
            {
                return Redirect(
                    "https://thefinocrat.com/app/finhome"
                    + "?payment=failed"
                    + $"&order_id={Uri.EscapeDataString("")}"
                    );
            }
        }
    }
            

    public class HdfcCreatePaymentRequest
    {
        public decimal Amount { get; set; }

        public string CustomerId { get; set; } = "";

        public string CustomerEmail { get; set; } = "";

        public string CustomerPhone { get; set; } = "";

        public string FirstName { get; set; } = "";

        public string LastName { get; set; } = "";

        public string? SelectedGateway { get; set; }

        public string? LoggedInUserPhone { get; set; }

        public string? cardnum { get; set; }
    }

    public class HdfcPaymentResponse
    {
        public bool Success { get; set; }

        public string? OrderId { get; set; }

        public string? PaymentUrl { get; set; }

        public string? Status { get; set; }

        public string? Message { get; set; }

        public object? HdfcResponse { get; set; }
    }
}
