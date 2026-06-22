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

            // Isolate logs by user (unless Admin)
            if (!User.IsInRole("Admin"))
            {
                var userId = _currentUserService.UserId;
                query = query.Where(l => l.UserId == userId);
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
            var query = _context.StoreDailyLogs
                .Include(l => l.Site)
                .Include(l => l.Items)
                .ThenInclude(i => i.StoreTool)
                .AsQueryable();

            if (!User.IsInRole("Admin"))
            {
                var userId = _currentUserService.UserId;
                query = query.Where(l => l.UserId == userId);
            }

            var log = await query.FirstOrDefaultAsync(l => l.Id == id);

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
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var log = new StoreDailyLog
            {
                SiteId = dto.SiteId,
                UserId = userId,
                Date = dto.Date,
                TimeOut = dto.TimeOut,
                TimeIn = null
            };

            foreach (var itemDto in dto.Items)
            {
                // Use per-user personal stock (UserToolStock)
                var userStock = await _context.UserToolStocks
                    .Include(s => s.StoreTool)
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.StoreToolId == itemDto.StoreToolId);

                if (userStock == null || userStock.AvailableQuantity < itemDto.QuantityOut)
                {
                    var toolName = userStock?.StoreTool?.Description ?? $"Tool #{itemDto.StoreToolId}";
                    var available = userStock?.AvailableQuantity ?? 0;
                    return BadRequest($"Not enough stock for '{toolName}' in your personal inventory. Available: {available}, Requested: {itemDto.QuantityOut}");
                }

                userStock.AvailableQuantity -= itemDto.QuantityOut;

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
            if (!User.IsInRole("Admin") && log.UserId != _currentUserService.UserId) return Forbid();
            if (log.TimeIn.HasValue) return BadRequest("This log has already been checked in.");

            log.TimeIn = dto.TimeIn;

            foreach (var itemDto in dto.Items)
            {
                var logItem = log.Items.FirstOrDefault(i => i.Id == itemDto.StoreDailyLogItemId);
                if (logItem != null)
                {
                    logItem.QuantityIn = itemDto.QuantityIn;

                    // Restore user-specific stock
                    var userStock = await _context.UserToolStocks
                        .FirstOrDefaultAsync(s => s.UserId == log.UserId && s.StoreToolId == logItem.StoreToolId);

                    if (userStock != null)
                    {
                        userStock.AvailableQuantity += itemDto.QuantityIn;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { log.Id });
        }
    }
}
