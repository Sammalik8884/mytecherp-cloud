using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public class SiteToolStocksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SiteToolStocksController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>Get all tool stocks for a specific site.</summary>
        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetBySite(int siteId)
        {
            var stocks = await _context.SiteToolStocks
                .Include(s => s.StoreTool)
                .Where(s => s.SiteId == siteId)
                .OrderBy(s => s.StoreTool.Description)
                .Select(s => new
                {
                    s.Id,
                    s.SiteId,
                    s.StoreToolId,
                    s.StoreTool.Description,
                    s.StoreTool.TotalQuantity,
                    s.AvailableQuantity
                })
                .ToListAsync();

            return Ok(stocks);
        }

        /// <summary>
        /// Search tools with site-specific availability.
        /// If siteId is provided, returns the AvailableQuantity for that site.
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int siteId)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<object>());

            var query = q.ToLower();

            // Get all matching tools
            var tools = await _context.StoreTools
                .Where(t => t.Description.ToLower().Contains(query) && !t.IsDeleted)
                .ToListAsync();

            // Get site-specific stocks for these tools
            var toolIds = tools.Select(t => t.Id).ToList();
            var siteStocks = await _context.SiteToolStocks
                .Where(s => s.SiteId == siteId && toolIds.Contains(s.StoreToolId))
                .ToListAsync();

            var result = tools.Select(t =>
            {
                var stock = siteStocks.FirstOrDefault(s => s.StoreToolId == t.Id);
                return new
                {
                    id = t.Id,
                    description = t.Description,
                    totalQuantity = t.TotalQuantity,
                    currentQuantity = stock?.AvailableQuantity ?? 0, // site-specific availability
                    hasStock = stock != null
                };
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Add/receive stock for a site (e.g. from procurement or manual entry).
        /// Creates the SiteToolStock record if it doesn't exist yet.
        /// </summary>
        [HttpPost("receive")]
        [Authorize(Roles = "Admin,Procurement Executive")]
        public async Task<IActionResult> ReceiveStock([FromBody] ReceiveStockDto dto)
        {
            foreach (var item in dto.Items)
            {
                var stock = await _context.SiteToolStocks
                    .FirstOrDefaultAsync(s => s.SiteId == dto.SiteId && s.StoreToolId == item.StoreToolId);

                if (stock == null)
                {
                    stock = new SiteToolStock
                    {
                        SiteId = dto.SiteId,
                        StoreToolId = item.StoreToolId,
                        AvailableQuantity = item.Quantity
                    };
                    _context.SiteToolStocks.Add(stock);
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
            return Ok(new { message = "Stock received successfully." });
        }

        /// <summary>Manually set (override) the stock quantity for a site+tool.</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetQuantity(int id, [FromBody] SetQuantityDto dto)
        {
            var stock = await _context.SiteToolStocks.FindAsync(id);
            if (stock == null) return NotFound();

            stock.AvailableQuantity = dto.Quantity;
            await _context.SaveChangesAsync();
            return Ok(stock);
        }
    }

    public class ReceiveStockDto
    {
        public int SiteId { get; set; }
        public List<ReceiveStockItemDto> Items { get; set; } = new();
    }

    public class ReceiveStockItemDto
    {
        public int StoreToolId { get; set; }
        public int Quantity { get; set; }
    }

    public class SetQuantityDto
    {
        public int Quantity { get; set; }
    }
}
