using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Store;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
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

        public StoreToolsController(IGenericRepository<StoreTool> repository)
        {
            _repository = repository;
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
            var existingTools = await _repository.GetAllAsync();
            if (existingTools.Any(t => t.Description.ToLower() == dto.Description.ToLower() && !t.IsDeleted))
            {
                return BadRequest($"A tool with description '{dto.Description}' already exists.");
            }

            var tool = new StoreTool
            {
                Description = dto.Description,
                TotalQuantity = dto.TotalQuantity,
                CurrentQuantity = dto.TotalQuantity // newly created tools have full inventory
            };

            await _repository.AddAsync(tool);

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
