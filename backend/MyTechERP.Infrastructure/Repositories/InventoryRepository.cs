using Microsoft.EntityFrameworkCore;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Inventory;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly MytechERP.Application.Interfaces.ICurrentUserService _currentUserService;

        public InventoryRepository(ApplicationDbContext context, MytechERP.Application.Interfaces.ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<InventoryStock?> GetStockEntryAsync(int productId, int warehouseId)
        {
            return await _context.InventoryStocks
                .FirstOrDefaultAsync(s => s.ProductId == productId && s.WarehouseId == warehouseId);
        }

        public async Task AddStockAsync(InventoryStock stock)
        {
            _context.InventoryStocks.Add(stock);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateStockAsync(InventoryStock stock)
        {
            _context.InventoryStocks.Update(stock);
            await _context.SaveChangesAsync();
        }

        public async Task<List<InventoryStock>> GetStockLevelsForProductAsync(int productId)
        {
            var stocks = await _context.InventoryStocks
                .Where(s => s.ProductId == productId)
                .AsNoTracking()
                .ToListAsync();

            if (stocks.Any())
            {
                var warehouseIds = stocks.Select(s => s.WarehouseId).Distinct().ToList();
                var warehouses = await _context.Warehouses
                    .IgnoreQueryFilters()
                    .Where(w => warehouseIds.Contains(w.Id) && w.TenantId == _currentUserService.TenantId)
                    .ToDictionaryAsync(w => w.Id);

                foreach (var stock in stocks)
                {
                    if (warehouses.TryGetValue(stock.WarehouseId, out var w))
                    {
                        stock.Warehouse = w;
                    }
                }
            }

            return stocks;
        }

        public async Task AddStockTransferAsync(StockTransfer transfer)
        {
            _context.stockTransfers.Add(transfer);
            await _context.SaveChangesAsync();
        }
        public async Task AddStockAdjustmentAsync(StockAdjustment adjustment)
        {
            _context.StockAdjustments.Add(adjustment);
            await _context.SaveChangesAsync();
        }
    }
}

