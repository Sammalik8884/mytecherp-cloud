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

            // Auto-seed this new tool into ALL existing sites with AvailableQuantity = 0
            var allSiteIds = await _context.Sites
                .Select(s => s.Id)
                .ToListAsync();

            foreach (var siteId in allSiteIds)
            {
                _context.SiteToolStocks.Add(new SiteToolStock
                {
                    SiteId = siteId,
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
    }
}
