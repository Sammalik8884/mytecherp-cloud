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
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _service;

        public InventoryController(IInventoryService service)
        {
            _service = service;
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("stock/add")]
        public async Task<IActionResult> AddStock([FromBody] StockMovementDto dto)
        {
            await _service.AddStockAsync(dto);
            return Ok(new { Message = "Stock Added Successfully" });
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPut("stock/update")]
        public async Task<IActionResult> UpdateStock([FromBody] StockMovementDto dto)
        {
            try
            {
                await _service.UpdateExactStockAsync(dto);
                return Ok(new { Message = "Stock Updated Successfully" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpDelete("stock/{productId}/{warehouseId}")]
        public async Task<IActionResult> DeleteStock(int productId, int warehouseId)
        {
            try
            {
                var result = await _service.DeleteStockAsync(productId, warehouseId);
                if (!result) return NotFound(new { Error = "Stock record not found." });
                return Ok(new { Message = "Stock Deleted Successfully" });
            }
            catch (System.Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex.GetType().Name == "DbUpdateException")
                {
                    return BadRequest(new { Error = "Cannot delete this stock record because it is referenced in active transfers, invoices, or work orders." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpPost("stock/consume")]
        public async Task<IActionResult> ConsumeStock([FromBody] StockMovementDto dto)
        {
            try
            {
                await _service.ConsumeStockAsync(dto);
                return Ok(new { Message = "Stock Consumed Successfully" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet("stock/{productId}")]
        public async Task<IActionResult> GetStockLevels(int productId)
        {
            var levels = await _service.GetStockLevelsAsync(productId);
            try {
                var json = System.Text.Json.JsonSerializer.Serialize(levels);
                System.IO.File.AppendAllText("stock_debug.txt", $"[{DateTime.UtcNow}] Product: {productId} - Data: {json}\n");
            } catch { }

            return Ok(levels);
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("transfer")]
        public async Task<IActionResult> TransferStock([FromBody] CreateTransferDto dto)
        {
            try
            {
                await _service.TransferStockAsync(dto);
                return Ok(new { Message = "Stock Transferred Successfully" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

}
