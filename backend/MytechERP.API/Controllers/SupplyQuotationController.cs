using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.Quotations;
using MytechERP.Application.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupplyQuotationController : ControllerBase
    {
        private readonly ISupplyQuotationService _service;
        
        // Only these users are allowed
        private readonly List<string> _allowedEmails = new List<string>
        {
            "ahmed.faisal@mytecheng.com",
            "kaleemmullah@mytecheng.com",
            "munawar.hasan@mytecheng.com"
        };

        public SupplyQuotationController(ISupplyQuotationService service)
        {
            _service = service;
        }

        private bool IsAuthorized()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            return !string.IsNullOrEmpty(email) && _allowedEmails.Contains(email.ToLower());
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!IsAuthorized()) return Forbid();
            var quotes = await _service.GetAllSupplyQuotationsAsync();
            return Ok(quotes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (!IsAuthorized()) return Forbid();
            var quote = await _service.GetSupplyQuotationByIdAsync(id);
            if (quote == null) return NotFound();
            return Ok(quote);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSupplyQuotationDto dto)
        {
            if (!IsAuthorized()) return Forbid();
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var quote = await _service.CreateSupplyQuotationAsync(dto, userId);
            return Ok(quote);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateSupplyQuotationDto dto)
        {
            if (!IsAuthorized()) return Forbid();
            var quote = await _service.UpdateSupplyQuotationAsync(id, dto);
            return Ok(quote);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsAuthorized()) return Forbid();
            await _service.DeleteSupplyQuotationAsync(id);
            return NoContent();
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> GeneratePdf(int id)
        {
            if (!IsAuthorized()) return Forbid();
            var pdfBytes = await _service.GeneratePdfAsync(id);
            return File(pdfBytes, "application/pdf", $"SupplyQuotation_{id}.pdf");
        }

        [HttpGet("{id}/excel")]
        public async Task<IActionResult> GenerateExcel(int id)
        {
            if (!IsAuthorized()) return Forbid();
            var excelBytes = await _service.GenerateExcelAsync(id);
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"SupplyQuotation_{id}.xlsx");
        }
    }
}
