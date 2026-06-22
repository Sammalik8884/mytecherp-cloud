using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Store;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StoreDailyLogsController : ControllerBase
    {
        private readonly IGenericRepository<StoreDailyLog> _repository;
        private readonly ApplicationDbContext _context;

        public StoreDailyLogsController(IGenericRepository<StoreDailyLog> repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var logs = await _context.StoreDailyLogs
                .Include(l => l.Site)
                .Include(l => l.Items)
                .ThenInclude(i => i.StoreTool)
                .OrderByDescending(l => l.Date)
                .ToListAsync();

            var dtos = logs.Select(l => new StoreDailyLogDto
            {
                Id = l.Id,
                SiteId = l.SiteId,
                SiteName = l.Site?.Name ?? "Unknown",
                Date = l.Date,
                TimeOut = l.TimeOut,
                TimeIn = l.TimeIn,
                Items = l.Items.Select(i => new StoreDailyLogItemDto
                {
                    Id = i.Id,
                    StoreToolId = i.StoreToolId,
                    ToolDescription = i.StoreTool?.Description ?? "Unknown",
                    CustomDescription = i.CustomDescription,
                    QuantityOut = i.QuantityOut,
                    QuantityIn = i.QuantityIn
                }).ToList()
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var log = await _context.StoreDailyLogs
                .Include(l => l.Site)
                .Include(l => l.Items)
                .ThenInclude(i => i.StoreTool)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (log == null) return NotFound();

            var dto = new StoreDailyLogDto
            {
                Id = log.Id,
                SiteId = log.SiteId,
                SiteName = log.Site?.Name ?? "Unknown",
                Date = log.Date,
                TimeOut = log.TimeOut,
                TimeIn = log.TimeIn,
                Items = log.Items.Select(i => new StoreDailyLogItemDto
                {
                    Id = i.Id,
                    StoreToolId = i.StoreToolId,
                    ToolDescription = i.StoreTool?.Description ?? "Unknown",
                    CustomDescription = i.CustomDescription,
                    QuantityOut = i.QuantityOut,
                    QuantityIn = i.QuantityIn
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpPost("checkout")]
        [Authorize(Roles = "Admin,Procurement Executive")]
        public async Task<IActionResult> Checkout([FromBody] CreateStoreDailyLogDto dto)
        {
            var log = new StoreDailyLog
            {
                SiteId = dto.SiteId,
                Date = dto.Date,
                TimeOut = dto.TimeOut,
                TimeIn = null
            };

            foreach (var itemDto in dto.Items)
            {
                var tool = await _context.StoreTools.FindAsync(itemDto.StoreToolId);
                if (tool == null)
                    return BadRequest($"Tool with ID {itemDto.StoreToolId} not found.");

                if (tool.CurrentQuantity < itemDto.QuantityOut)
                    return BadRequest($"Not enough quantity for tool '{tool.Description}'. Available: {tool.CurrentQuantity}, Requested: {itemDto.QuantityOut}");

                tool.CurrentQuantity -= itemDto.QuantityOut;

                log.Items.Add(new StoreDailyLogItem
                {
                    StoreToolId = itemDto.StoreToolId,
                    CustomDescription = itemDto.CustomDescription,
                    QuantityOut = itemDto.QuantityOut
                });
            }

            _context.StoreDailyLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new { log.Id });
        }

        [HttpPost("{id}/checkin")]
        [Authorize(Roles = "Admin,Procurement Executive")]
        public async Task<IActionResult> Checkin(int id, [FromBody] CheckInStoreDailyLogDto dto)
        {
            var log = await _context.StoreDailyLogs
                .Include(l => l.Items)
                .ThenInclude(i => i.StoreTool)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (log == null)
                return NotFound();

            if (log.TimeIn.HasValue)
                return BadRequest("This log has already been checked in.");

            log.TimeIn = dto.TimeIn;

            foreach (var itemDto in dto.Items)
            {
                var logItem = log.Items.FirstOrDefault(i => i.Id == itemDto.StoreDailyLogItemId);
                if (logItem != null)
                {
                    logItem.QuantityIn = itemDto.QuantityIn;

                    // Update tool current quantity
                    var tool = logItem.StoreTool;
                    if (tool != null)
                    {
                        tool.CurrentQuantity += itemDto.QuantityIn;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { log.Id });
        }
    }
}
