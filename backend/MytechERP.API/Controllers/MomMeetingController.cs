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
    public class MomMeetingController : ControllerBase
    {
        private readonly IMomMeetingService _service;

        public MomMeetingController(IMomMeetingService service)
        {
            _service = service;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var meeting = await _service.GetMeetingByIdAsync(id);
            if (meeting == null) return NotFound();
            return Ok(meeting);
        }

        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetBySiteId(int siteId)
        {
            var meetings = await _service.GetMeetingsBySiteIdAsync(siteId);
            return Ok(meetings);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateMomMeetingDto dto)
        {
            try
            {
                var meeting = await _service.CreateMeetingAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = meeting.Id }, meeting);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteMeetingAsync(id);
            return NoContent();
        }
    }
}
