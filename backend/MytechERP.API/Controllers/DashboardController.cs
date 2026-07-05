using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.Interfaces;
using MytechERP.API.Filters;
using MytechERP.domain.Enums;
using MytechERP.domain.Roles;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly IPdfService _pdfService;

        public DashboardController(IDashboardService dashboardService, IPdfService pdfService)
        {
            _dashboardService = dashboardService;
            _pdfService = pdfService;
        }

        [HttpGet("metrics")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)]
        [RequirePlanFeature(PlanFeature.AdvancedAnalytics)]
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
        [HttpGet("sales-activity")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)]
        public async Task<IActionResult> GetSalesmanActivity([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? region, [FromQuery] string? salesmanId)
        {
            try
            {
                var metrics = await _dashboardService.GetSalesmanActivityMetricsAsync(startDate, endDate, region, salesmanId);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate salesman activity.", detail = ex.Message });
            }
        }
        
        [HttpGet("sales-activity/export/csv")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)]
        public async Task<IActionResult> ExportSalesActivityCsv([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? region, [FromQuery] string? salesmanId)
        {
            try
            {
                var metrics = await _dashboardService.GetSalesmanActivityMetricsAsync(startDate, endDate, region, salesmanId);
                var sb = new System.Text.StringBuilder();
                sb.AppendLine("Salesman,Date,Total Visits,Activity %");
                
                foreach (var summary in metrics.SalesmenSummary)
                {
                    foreach (var record in summary.DailyRecords)
                    {
                        sb.AppendLine($"\"{record.SalesmanName}\",{record.Date},{record.TotalVisits},{record.ActivityPercentage}%");
                    }
                }
                
                var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
                return File(bytes, "text/csv", $"Salesman_Activity_Report_{DateTime.UtcNow:yyyyMMdd}.csv");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate CSV.", detail = ex.Message });
            }
        }
        
        [HttpGet("sales-activity/export/pdf")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)]
        public async Task<IActionResult> ExportSalesActivityPdf([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? region, [FromQuery] string? salesmanId)
        {
            try
            {
                var metrics = await _dashboardService.GetSalesmanActivityMetricsAsync(startDate, endDate, region, salesmanId);
                var pdfBytes = await _pdfService.GenerateSalesmanActivityReportPdfAsync(metrics);
                return File(pdfBytes, "application/pdf", $"Salesman_Activity_Report_{DateTime.UtcNow:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate PDF.", detail = ex.Message });
            }
        }
        [HttpGet("estimator-metrics")]
        [Authorize(Roles = Roles.Estimation)]
        public async Task<IActionResult> GetEstimatorMetrics([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var metrics = await _dashboardService.GetEstimatorMetricsAsync(userId, startDate, endDate);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate estimator metrics.", detail = ex.Message });
            }
        }
        [HttpGet("estimator-activity")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)]
        public async Task<IActionResult> GetEstimatorsActivity([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? estimatorId)
        {
            try
            {
                var metrics = await _dashboardService.GetEstimatorsActivityAsync(startDate, endDate, estimatorId);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch estimator activity.", detail = ex.Message });
            }
        }
    }
}
