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
            try 
            {
                var form = await _service.CreateFormAsync(dto);
                return CreatedAtAction(nameof(GetFormById), new { id = form.Id }, form);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateForm(int id, [FromBody] CreateMaterialReceivingFormDto dto)
        {
            try
            {
                var form = await _service.UpdateFormAsync(id, dto);
                return Ok(form);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteForm(int id)
        {
            try
            {
                await _service.DeleteFormAsync(id);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
