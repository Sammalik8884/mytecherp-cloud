using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Infrastructure.Persistance;
using MytechERP.domain.Entities.System;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RegionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RegionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRegions()
        {
            var regions = await _context.SystemRegions.Select(r => r.Name).ToListAsync();
            return Ok(regions);
        }

        [HttpPost]
        public async Task<IActionResult> AddRegion([FromBody] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Name is required");

            if (!await _context.SystemRegions.AnyAsync(r => r.Name == name))
            {
                _context.SystemRegions.Add(new SystemRegion { Name = name });
                await _context.SaveChangesAsync();
            }

            return Ok(new { Message = "Region added" });
        }
    }
}
