using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.HR;
using MytechERP.Application.Interfaces.HR;

namespace MyTechERP.API.Controllers.HR
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationFormController : ControllerBase
    {
        private readonly IApplicationFormService _service;

        public ApplicationFormController(IApplicationFormService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateApplicationFormDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _service.CreateAsync(dto, userId);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var role = User.FindFirstValue(ClaimTypes.Role);
            var email = User.FindFirstValue(ClaimTypes.Email);
            var result = await _service.GetAllAsync(role, email);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateApplicationFormStatusDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var result = await _service.UpdateStatusAsync(id, dto, email);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
