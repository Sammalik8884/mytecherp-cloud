using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectTechnicalHandoverController : ControllerBase
    {
        private readonly IProjectTechnicalHandoverService _service;
        private readonly ICurrentUserService _currentUserService;

        public ProjectTechnicalHandoverController(IProjectTechnicalHandoverService service, ICurrentUserService currentUserService)
        {
            _service = service;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetBySiteId(int siteId)
        {
            var result = await _service.GetBySiteIdAsync(siteId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateProjectTechnicalHandoverDto dto)
        {
            var userId = _currentUserService.UserId;
            var result = await _service.CreateAsync(dto, userId);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] CreateProjectTechnicalHandoverDto dto)
        {
            var userId = _currentUserService.UserId;
            var result = await _service.UpdateAsync(id, dto, userId);
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
