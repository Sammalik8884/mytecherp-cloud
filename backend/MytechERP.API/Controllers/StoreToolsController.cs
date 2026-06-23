using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Store;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StoreToolsController : ControllerBase
    {
        private readonly IGenericRepository<StoreTool> _repository;
        private readonly ApplicationDbContext _context;

        public StoreToolsController(IGenericRepository<StoreTool> repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tools = await _repository.GetAllAsync();
            var dtos = tools.Select(t => new StoreToolDto
            {
                Id = t.Id,
                Description = t.Description,
                TotalQuantity = t.TotalQuantity,
                CurrentQuantity = t.CurrentQuantity
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<StoreToolDto>());

            var query = q.ToLower();
            var allTools = await _repository.GetAllAsync();
            var tools = allTools.Where(t => t.Description.ToLower().Contains(query));

            var dtos = tools.Select(t => new StoreToolDto
            {
                Id = t.Id,
                Description = t.Description,
                TotalQuantity = t.TotalQuantity,
                CurrentQuantity = t.CurrentQuantity
            }).ToList();

            return Ok(dtos);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Procurement Executive")]
        public async Task<IActionResult> Create([FromBody] CreateStoreToolDto dto)
        {
            // Prevent duplicate descriptions
            var allTools = await _repository.GetAllAsync();
            var exists = allTools.Any(t => t.Description.Trim().ToLower() == dto.Description.Trim().ToLower());
            if (exists)
                return Conflict($"A tool with the description '{dto.Description}' already exists. Please update the existing tool instead.");

            var tool = new StoreTool
            {
                Description = dto.Description.Trim(),
                TotalQuantity = dto.TotalQuantity,
                CurrentQuantity = dto.TotalQuantity
            };

            await _repository.AddAsync(tool);

            // Seed this new tool into the specific site if requested
            if (dto.SiteId.HasValue && dto.SiteId.Value > 0)
            {
                _context.SiteToolStocks.Add(new SiteToolStock
                {
                    SiteId = dto.SiteId.Value,
                    StoreToolId = tool.Id,
                    AvailableQuantity = 0
                });
            }
            await _context.SaveChangesAsync();

            var createdDto = new StoreToolDto
            {
                Id = tool.Id,
                Description = tool.Description,
                TotalQuantity = tool.TotalQuantity,
                CurrentQuantity = tool.CurrentQuantity
            };

            return Ok(createdDto);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Procurement Executive")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateStoreToolDto dto)
        {
            var tool = await _repository.GetByIdAsync(id);
            if (tool == null)
                return NotFound();

            // Check for duplicate descriptions, excluding the current tool
            var allTools = await _repository.GetAllAsync();
            var exists = allTools.Any(t => t.Id != id && t.Description.Trim().ToLower() == dto.Description.Trim().ToLower());
            if (exists)
                return Conflict($"A tool with the description '{dto.Description}' already exists.");

            tool.Description = dto.Description.Trim();
            tool.TotalQuantity = dto.TotalQuantity;
            
            await _repository.UpdateAsync(tool);
            return Ok();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Procurement Executive")]
        public async Task<IActionResult> Delete(int id)
        {
            var tool = await _repository.GetByIdAsync(id);
            if (tool == null)
                return NotFound();

            // Check if it's used in site inventories (with non-zero quantity)
            var activeSites = await _context.SiteToolStocks
                .Include(s => s.Site)
                .Where(s => s.StoreToolId == id && s.AvailableQuantity > 0)
                .Select(s => s.Site.Name)
                .ToListAsync();

            if (activeSites.Any())
            {
                var siteNames = string.Join(", ", activeSites);
                return Conflict($"Cannot delete this tool because it is currently assigned to the following site inventory with a non-zero quantity: {siteNames}");
            }

            // Optionally, we could just soft delete. For now we will soft delete if we have an IsDeleted flag, otherwise remove
            if (tool.GetType().GetProperty("IsDeleted") != null)
            {
                tool.IsDeleted = true;
                await _repository.UpdateAsync(tool);
            }
            else
            {
                await _repository.DeleteAsync(tool);
            }

            return Ok();
        }
    }
}
