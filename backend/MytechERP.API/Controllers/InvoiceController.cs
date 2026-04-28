using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.domain.Roles;
using MytechERP.Application.Interfaces;
using System.Security.Claims;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _service;

        public InvoiceController(IInvoiceService service)
        {
            _service = service;
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpPost("from-quote/{id}")]
        public async Task<IActionResult> CreateFromQuote(int id)
        {
            try
            {
                var invoice = await _service.CreateFromQuotationAsync(id);
                return Ok(new
                {
                    Message = "Invoice Generated Successfully",
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpPost("generate-from-job/{workOrderId}")]
        public async Task<IActionResult> GenerateInvoice(int workOrderId)
        {
            try
            {
                var invoiceId = await _service.GenerateInvoiceFromJobAsync(workOrderId);
                return Ok(new { Message = "Invoice Generated Successfully", InvoiceId = invoiceId });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpPost("custom")]
        public async Task<IActionResult> CreateCustom([FromBody] MytechERP.Application.DTOs.Finance.CreateInvoiceDto dto)
        {
            try
            {
                var tenantId = User.FindFirst("TenantId")?.Value ?? "1";
                var invoice = await _service.CreateCustomInvoiceAsync(dto, tenantId);
                return Ok(new
                {
                    Message = "Custom Invoice Generated Successfully",
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpPut("custom/{id}")]
        public async Task<IActionResult> UpdateCustom(int id, [FromBody] MytechERP.Application.DTOs.Finance.CreateInvoiceDto dto)
        {
            try
            {
                var tenantId = User.FindFirst("TenantId")?.Value ?? "1";
                var invoice = await _service.UpdateCustomInvoiceAsync(id, dto, tenantId);
                return Ok(new
                {
                    Message = "Invoice Updated Successfully",
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tenantId = User.FindFirst("TenantId")?.Value ?? "1";
            var invoices = await _service.GetAllAsync(tenantId);
            return Ok(invoices);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Customers)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var tenantId = User.FindFirst("TenantId")?.Value ?? "1";
                var invoice = await _service.GetByIdAsync(id, tenantId);
                return Ok(invoice);
            }
            catch (System.Collections.Generic.KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] int status)
        {
            var tenantId = User.FindFirst("TenantId")?.Value ?? "1";
            var result = await _service.UpdateStatusAsync(id, status, tenantId);
            if (!result) return NotFound();
            return Ok(new { Message = "Invoice status updated successfully." });
        }

        [Authorize(Roles = Roles.Customers)]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyInvoices()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { Error = "Cannot determine identity from token." });

            var invoices = await _service.GetByCustomerEmailAsync(email);
            return Ok(invoices);
        }

        [Authorize]
        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> GetPdf(int id, [FromServices] IPdfService pdfService)
        {
            try
            {
                var pdfBytes = await pdfService.GenerateInvoicePdfAsync(id);
                return File(pdfBytes, "application/pdf", $"Invoice_{id}.pdf");
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpGet("bank-accounts")]
        public async Task<IActionResult> GetBankAccounts()
        {
            var tenantId = User.FindFirst("TenantId")?.Value ?? "1";
            var accounts = await _service.GetBankAccountsAsync(tenantId);
            return Ok(accounts);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        [HttpPost("bank-accounts")]
        public async Task<IActionResult> AddBankAccount([FromBody] MytechERP.Application.DTOs.Finance.BankAccountDto dto)
        {
            try
            {
                var tenantId = User.FindFirst("TenantId")?.Value ?? "1";
                var result = await _service.AddBankAccountAsync(dto, tenantId);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}

