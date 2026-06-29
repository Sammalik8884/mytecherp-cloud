using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs;
using MytechERP.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ActivityController : ControllerBase
    {
        private readonly IActivityService _activityService;

        public ActivityController(IActivityService activityService)
        {
            _activityService = activityService;
        }

        [HttpGet]
        public async Task<IActionResult> GetActivities([FromQuery] string? userId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var (data, totalCount) = await _activityService.GetActivitiesAsync(userId, startDate, endDate, page, pageSize);
            
            return Ok(new {
                Data = data,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetActivityStats([FromQuery] string? userId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var stats = await _activityService.GetActivityStatsAsync(userId, startDate, endDate);
            return Ok(stats);
        }
    }
}
