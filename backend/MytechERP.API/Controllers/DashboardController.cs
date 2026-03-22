using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.Interfaces;
using MytechERP.API.Filters;
using MytechERP.domain.Enums;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [RequirePlanFeature(PlanFeature.AdvancedAnalytics)]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("metrics")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMetrics([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var metrics = await _dashboardService.GetExecutiveMetricsAsync(startDate, endDate);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate dashboard metrics.", detail = ex.Message });
            }
        }
    }
}
