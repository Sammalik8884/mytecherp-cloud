using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs;
using MytechERP.Application.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyTechERP.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ToolBoxTalkController : ControllerBase
    {
        private readonly IToolBoxTalkService _service;

        public ToolBoxTalkController(IToolBoxTalkService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ToolBoxTalkDto>>> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ToolBoxTalkDto>> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ToolBoxTalkDto>> Create(ToolBoxTalkDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ToolBoxTalkDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpPut("attendee/{attendeeId}")]
        public async Task<IActionResult> UpdateAttendee(int attendeeId, ToolBoxTalkAttendeeDto dto)
        {
            await _service.UpdateAttendeeAsync(attendeeId, dto);
            return NoContent();
        }

        [HttpDelete("attendee/{attendeeId}")]
        public async Task<IActionResult> DeleteAttendee(int attendeeId)
        {
            await _service.DeleteAttendeeAsync(attendeeId);
            return NoContent();
        }
    }
}
