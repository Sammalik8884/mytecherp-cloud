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
    public class WarehouseController : ControllerBase
    {
        private readonly IWarehouseService _warehouseService;

        public WarehouseController(IWarehouseService warehouseService)
        {
            _warehouseService = warehouseService;
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var warehouses = await _warehouseService.GetAllAsync();
            return Ok(warehouses);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var warehouse = await _warehouseService.GetByIdAsync(id);
            if (warehouse == null)
            {
                return NotFound();
            }
            return Ok(warehouse);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWarehouseDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var warehouse = await _warehouseService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = warehouse.Id }, warehouse);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateWarehouseDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _warehouseService.UpdateAsync(id, dto);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _warehouseService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex.GetType().Name == "DbUpdateException")
                {
                    return BadRequest(new { Error = "Cannot delete this warehouse because it has linked stock records. Please delete or transfer the stock first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }
    }
}
