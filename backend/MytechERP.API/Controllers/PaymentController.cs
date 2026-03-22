using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentTransactionService _paymentService;

        public PaymentController(IPaymentTransactionService paymentService)
        {
            _paymentService = paymentService;
        }

        public class InitiatePaymentRequest
        {
            public int InvoiceId { get; set; }
            public decimal Amount { get; set; }
            public string CustomerEmail { get; set; } = string.Empty;
        }

        [HttpPost("initiate")]
        public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
        {
            try
            {
                var checkoutUrl = await _paymentService.InitiatePaymentAsync(
                    request.InvoiceId,
                    request.Amount,
                    request.CustomerEmail
                );

                return Ok(new
                {
                    Message = "Payment initiated successfully",
                    CheckoutUrl = checkoutUrl
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

}

