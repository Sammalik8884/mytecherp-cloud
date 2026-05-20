using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.System;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TermsAndConditionsController : ControllerBase
    {
        private readonly ITermsAndConditionsService _service;

        public TermsAndConditionsController(ITermsAndConditionsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var templates = await _service.GetAllAsync();
            return Ok(templates);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var template = await _service.GetByIdAsync(id);
            if (template == null) return NotFound();
            return Ok(template);
        }

        [HttpGet("default")]
        public async Task<IActionResult> GetDefault()
        {
            var template = await _service.GetDefaultAsync();
            if (template == null) return NotFound();
            return Ok(template);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TermsAndConditionsTemplate template)
        {
            var created = await _service.CreateAsync(template);
            return Ok(created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TermsAndConditionsTemplate template)
        {
            var updated = await _service.UpdateAsync(id, template);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpPost("{id}/default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            var result = await _service.SetDefaultAsync(id);
            if (!result) return NotFound();
            return Ok(new { success = true });
        }
    }
}
