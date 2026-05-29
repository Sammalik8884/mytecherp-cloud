using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DailyProgressReportController : ControllerBase
    {
        private readonly IDailyProgressReportService _dprService;

        public DailyProgressReportController(IDailyProgressReportService dprService)
        {
            _dprService = dprService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateDailyProgressReportDto dto)
        {
            var result = await _dprService.CreateAsync(dto);
            return Ok(result);
        }

        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetBySiteId(int siteId)
        {
            var results = await _dprService.GetBySiteIdAsync(siteId);
            return Ok(results);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _dprService.DeleteAsync(id);
            return NoContent();
        }
    }
}