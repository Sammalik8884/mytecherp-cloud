using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserToolStocksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public UserToolStocksController(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        /// <summary>Get all tool stocks for the logged-in user.</summary>
        [HttpGet("my-stock")]
        public async Task<IActionResult> GetMyStock()
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var stocks = await _context.UserToolStocks
                .Include(s => s.StoreTool)
                .Where(s => s.UserId == userId)
                .OrderBy(s => s.StoreTool.Description)
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    s.StoreToolId,
                    s.StoreTool.Description,
                    s.StoreTool.TotalQuantity,
                    s.AvailableQuantity
                })
                .ToListAsync();

            return Ok(stocks);
        }

        /// <summary>
        /// Search tools with user-specific availability.
        /// Returns the AvailableQuantity for the logged-in user.
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<object>());

            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var query = q.ToLower();

            // Get all matching tools from the global catalog
            var tools = await _context.StoreTools
                .Where(t => t.Description.ToLower().Contains(query) && !t.IsDeleted)
                .ToListAsync();

            // Get user-specific stocks for these tools
            var toolIds = tools.Select(t => t.Id).ToList();
            var userStocks = await _context.UserToolStocks
                .Where(s => s.UserId == userId && toolIds.Contains(s.StoreToolId))
                .ToListAsync();

            var result = tools.Select(t =>
            {
                var stock = userStocks.FirstOrDefault(s => s.StoreToolId == t.Id);
                return new
                {
                    id = t.Id,
                    description = t.Description,
                    totalQuantity = t.TotalQuantity,
                    currentQuantity = stock?.AvailableQuantity ?? 0, // user-specific availability
                    hasStock = stock != null
                };
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Add/receive stock for the logged-in user (e.g. from procurement).
        /// Creates the UserToolStock record if it doesn't exist yet.
        /// </summary>
        [HttpPost("receive")]
        [Authorize(Roles = "Admin,Procurement Executive")]
        public async Task<IActionResult> ReceiveStock([FromBody] ReceiveUserStockDto dto)
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            foreach (var item in dto.Items)
            {
                var stock = await _context.UserToolStocks
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.StoreToolId == item.StoreToolId);

                if (stock == null)
                {
                    stock = new UserToolStock
                    {
                        UserId = userId,
                        StoreToolId = item.StoreToolId,
                        AvailableQuantity = item.Quantity
                    };
                    _context.UserToolStocks.Add(stock);
                }
                else
                {
                    stock.AvailableQuantity += item.Quantity;
                }

                // Also update the global totals for the tool
                var tool = await _context.StoreTools.FindAsync(item.StoreToolId);
                if (tool != null)
                {
                    tool.TotalQuantity += item.Quantity;
                    tool.CurrentQuantity += item.Quantity;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Stock received successfully into your personal inventory." });
        }
    }

    public class ReceiveUserStockDto
    {
        public List<ReceiveUserStockItemDto> Items { get; set; } = new();
    }

    public class ReceiveUserStockItemDto
    {
        public int StoreToolId { get; set; }
        public int Quantity { get; set; }
    }
}
