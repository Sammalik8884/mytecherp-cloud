using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers.CRM
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ItemProcurementController : ControllerBase
    {
        private readonly IItemProcurementService _itemProcurementService;
        private readonly MyTechERP.Infrastructure.Services.IItemProcurementPdfService _pdfService;

        public ItemProcurementController(IItemProcurementService itemProcurementService, MyTechERP.Infrastructure.Services.IItemProcurementPdfService pdfService)
        {
            _itemProcurementService = itemProcurementService;
            _pdfService = pdfService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? siteId)
        {
            var result = await _itemProcurementService.GetAllItemProcurementsAsync(siteId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _itemProcurementService.GetItemProcurementByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateItemProcurementDto dto)
        {
            var result = await _itemProcurementService.CreateItemProcurementAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateItemProcurementDto dto)
        {
            try
            {
                var result = await _itemProcurementService.UpdateItemProcurementAsync(id, dto);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _itemProcurementService.DeleteItemProcurementAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpGet("{id}/pdf")]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadPdf(int id)
        {
            var result = await _itemProcurementService.GetItemProcurementByIdAsync(id);
            if (result == null) return NotFound();

            var pdfBytes = _pdfService.GeneratePdf(result);
            return File(pdfBytes, "application/pdf", $"ItemProcurement_{id}.pdf");
        }
    }
}
