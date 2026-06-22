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
        private readonly ICurrentUserService _currentUserService;

        public StoreDailyLogsController(IGenericRepository<StoreDailyLog> repository, ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _repository = repository;
            _context = context;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var query = _context.StoreDailyLogs
                .Include(l => l.Site)
                .Include(l => l.Items)
                .ThenInclude(i => i.StoreTool)
                .AsQueryable();

            if (_currentUserService.Role == "Procurement Executive")
            {
                var userSiteId = _context.Users.Where(u => u.Id == _currentUserService.UserId).Select(u => EF.Property<int?>(u, "SiteId")).FirstOrDefault();
                if (userSiteId.HasValue)
                {
                    query = query.Where(l => l.SiteId == userSiteId.Value);
                }
            }

            var logs = await query.OrderByDescending(l => l.Date).ToListAsync();

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
                // Use per-site stock instead of global StoreTool.CurrentQuantity
                var siteStock = await _context.SiteToolStocks
                    .Include(s => s.StoreTool)
                    .FirstOrDefaultAsync(s => s.SiteId == dto.SiteId && s.StoreToolId == itemDto.StoreToolId);

                if (siteStock == null || siteStock.AvailableQuantity < itemDto.QuantityOut)
                {
                    var toolName = siteStock?.StoreTool?.Description ?? $"Tool #{itemDto.StoreToolId}";
                    var available = siteStock?.AvailableQuantity ?? 0;
                    return BadRequest($"Not enough stock for '{toolName}' at this site. Available: {available}, Requested: {itemDto.QuantityOut}");
                }

                siteStock.AvailableQuantity -= itemDto.QuantityOut;

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

            if (log == null) return NotFound();
            if (log.TimeIn.HasValue) return BadRequest("This log has already been checked in.");

            log.TimeIn = dto.TimeIn;

            foreach (var itemDto in dto.Items)
            {
                var logItem = log.Items.FirstOrDefault(i => i.Id == itemDto.StoreDailyLogItemId);
                if (logItem != null)
                {
                    logItem.QuantityIn = itemDto.QuantityIn;

                    // Restore site-specific stock
                    var siteStock = await _context.SiteToolStocks
                        .FirstOrDefaultAsync(s => s.SiteId == log.SiteId && s.StoreToolId == logItem.StoreToolId);

                    if (siteStock != null)
                    {
                        siteStock.AvailableQuantity += itemDto.QuantityIn;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { log.Id });
        }
    }
}
