using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.domain.Roles;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using System.Security.Claims;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.Technician)]
    public class TimeTrackingController : ControllerBase
    {
        private readonly ITimeTrackingService _timeService;

        public TimeTrackingController(ITimeTrackingService timeService)
        {
            _timeService = timeService;
        }

        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            var techId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var id = await _timeService.CheckInAsync(dto, techId ?? "Unknown");
            return Ok(new { Message = "Checked In", TimeLogId = id });
        }

        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutDto dto)
        {
            var techId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            await _timeService.CheckOutAsync(dto, techId ?? "Unknown");
            return Ok(new { Message = "Checked Out" });
        }
    }

}

