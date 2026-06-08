using System.Collections.Generic;
using System.Security.Claims;
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
    public class ProjectSpotCheckSiteController : ControllerBase
    {
        private readonly IProjectSpotCheckSiteService _service;

        public ProjectSpotCheckSiteController(IProjectSpotCheckSiteService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<ActionResult<ProjectSpotCheckSiteDto>> Create([FromBody] CreateProjectSpotCheckSiteDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _service.CreateAsync(dto, userId);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProjectSpotCheckSiteDto>> Update(int id, [FromBody] CreateProjectSpotCheckSiteDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _service.UpdateAsync(id, dto, userId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectSpotCheckSiteDto>> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectSpotCheckSiteDto>>> GetAll()
        {
            var results = await _service.GetAllAsync();
            return Ok(results);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
