using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MaterialReceivingController : ControllerBase
    {
        private readonly IMaterialReceivingService _service;

        public MaterialReceivingController(IMaterialReceivingService service)
        {
            _service = service;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFormById(int id)
        {
            var form = await _service.GetFormByIdAsync(id);
            if (form == null) return NotFound();

            return Ok(form);
        }

        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetFormsBySiteId(int siteId)
        {
            var forms = await _service.GetFormsBySiteIdAsync(siteId);
            return Ok(forms);
        }

        [HttpGet("location/{location}")]
        public async Task<IActionResult> GetByLocation(string location)
        {
            var forms = await _service.GetFormsByLocationAsync(location);
            return Ok(forms);
        }

        [HttpPost]
        public async Task<IActionResult> CreateForm([FromBody] CreateMaterialReceivingFormDto dto)
        {
            var form = await _service.CreateFormAsync(dto);
            return CreatedAtAction(nameof(GetFormById), new { id = form.Id }, form);
        }
    }
}
