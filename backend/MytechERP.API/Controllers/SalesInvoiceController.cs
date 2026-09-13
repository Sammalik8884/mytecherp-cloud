using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.SalesInvoices;
using MytechERP.Application.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SalesInvoiceController : ControllerBase
    {
        private readonly ISalesInvoiceService _invoiceService;

        public SalesInvoiceController(ISalesInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSalesInvoiceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var invoice = await _invoiceService.CreateInvoiceAsync(dto, userId);
            return Ok(invoice);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var invoices = await _invoiceService.GetAllInvoicesAsync();
            return Ok(invoices);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            return Ok(invoice);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _invoiceService.DeleteInvoiceAsync(id);
            return Ok();
        }

        [HttpGet("{id}/pdf")]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadPdf(int id)
        {
            var pdfBytes = await _invoiceService.GeneratePdfAsync(id);
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            return File(pdfBytes, "application/pdf", $"{invoice.InvoiceNumber}.pdf");
        }
    }
}
