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
        private readonly IPdfService _pdfService;

        public DashboardController(IDashboardService dashboardService, IPdfService pdfService)
        {
            _dashboardService = dashboardService;
            _pdfService = pdfService;
        }

        [HttpGet("metrics")]
        [Authorize(Roles = "Admin,Manager")]
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
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetSalesmanActivity([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var metrics = await _dashboardService.GetSalesmanActivityMetricsAsync(startDate, endDate);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate salesman activity.", detail = ex.Message });
            }
        }
        
        [HttpGet("sales-activity/export/csv")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ExportSalesActivityCsv([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var metrics = await _dashboardService.GetSalesmanActivityMetricsAsync(startDate, endDate);
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
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ExportSalesActivityPdf([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var metrics = await _dashboardService.GetSalesmanActivityMetricsAsync(startDate, endDate);
                var pdfBytes = await _pdfService.GenerateSalesmanActivityReportPdfAsync(metrics);
                return File(pdfBytes, "application/pdf", $"Salesman_Activity_Report_{DateTime.UtcNow:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate PDF.", detail = ex.Message });
            }
        }
    }
}
