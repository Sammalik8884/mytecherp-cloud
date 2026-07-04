using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.Procurement;
using MytechERP.Application.Interfaces;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers.Procurement
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VendorController : ControllerBase
    {
        private readonly IVendorService _vendorService;

        public VendorController(IVendorService vendorService)
        {
            _vendorService = vendorService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _vendorService.GetAllAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VendorDto dto)
        {
            return Ok(await _vendorService.CreateAsync(dto));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] VendorDto dto)
        {
            return Ok(await _vendorService.UpdateAsync(id, dto));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _vendorService.DeleteAsync(id);
            return NoContent();
        }
    }
}
