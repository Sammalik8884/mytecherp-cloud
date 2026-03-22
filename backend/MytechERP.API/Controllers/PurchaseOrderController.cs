using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.domain.Roles;
using MytechERP.Application.DTOs.Inventory;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PurchaseOrderController : ControllerBase
    {
        private readonly IPurchaseOrderService _service;
        private readonly IPdfService _pdfService;

        public PurchaseOrderController(IPurchaseOrderService service, IPdfService pdfService)
        {
            _service = service;
            _pdfService = pdfService;
        }

        [HttpGet("vendors")]
        public async Task<IActionResult> GetVendors()
        {
            var result = await _service.GetAllVendorsAsync();
            return Ok(result);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("vendors")]
        public async Task<IActionResult> CreateVendor([FromBody] CreateVendorDto dto)
        {
            var result = await _service.CreateVendorAsync(dto);
            return Ok(result);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPut("vendors/{id}")]
        public async Task<IActionResult> UpdateVendor(int id, [FromBody] UpdateVendorDto dto)
        {
            try
            {
                var result = await _service.UpdateVendorAsync(id, dto);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpDelete("vendors/{id}")]
        public async Task<IActionResult> DeleteVendor(int id)
        {
            try
            {
                await _service.DeleteVendorAsync(id);
                return Ok(new { Message = "Vendor deleted successfully." });
            }
            catch (System.Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex.GetType().Name == "DbUpdateException")
                {
                    return BadRequest(new { Error = "Cannot delete this vendor because they have linked purchase orders or products. Please delete or reassign those associated records first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPOs()
        {
            var result = await _service.GetAllPOsAsync();
            return Ok(result);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("create")]
        public async Task<IActionResult> CreatePO([FromBody] CreatePODto dto)
        {
            var po = await _service.CreatePOAsync(dto);
            return Ok(new { Message = "PO Created", PONumber = po.PONumber, Id = po.Id });
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePO(int id, [FromBody] UpdatePODto dto)
        {
            try
            {
                var po = await _service.UpdatePOAsync(id, dto);
                return Ok(new { Message = "PO Updated Successfully", PONumber = po.PONumber });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePO(int id)
        {
            try
            {
                await _service.DeletePOAsync(id);
                return Ok(new { Message = "Purchase Order deleted successfully." });
            }
            catch (System.Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is Microsoft.EntityFrameworkCore.DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot delete this purchase order due to linked constraints (e.g. received stock)." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("receive/{id}")]
        public async Task<IActionResult> ReceivePO(int id)
        {
            try
            {
                await _service.ReceivePOAsync(id);
                return Ok(new { Message = "Stock Updated Successfully! PO Marked as Received." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }



        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("mark-sent/{id}")]
        public async Task<IActionResult> MarkAsSent(int id)
        {
            try
            {
                await _service.MarkAsSentAsync(id);
                return Ok(new { Message = "PO Marked as Sent successfully!" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("send/{id}")]
        public async Task<IActionResult> SendToVendor(int id)
        {
            try
            {
                await _service.SendPOToVendorAsync(id);
                return Ok(new { Message = "Purchase Order generated and successfully emailed to vendor!" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DownloadPdf(int id)
        {
            try
            {
                var pdfBytes = await _pdfService.GeneratePurchaseOrderPdfAsync(id);
                return File(pdfBytes, "application/pdf", $"PO-{id}.pdf");
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

    }
}
