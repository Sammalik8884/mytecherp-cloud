using MytechERP.Application.DTOs.Inventory;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Inventory;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static MytechERP.domain.Inventory.StockTransfer;

namespace MyTechERP.Infrastructure.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _repo;
        private readonly ApplicationDbContext _context;
        public readonly ICurrentUserService _CurrentUserService;

        public InventoryService(IInventoryRepository repo, ApplicationDbContext context , ICurrentUserService currentUserService)
        {
            _repo = repo;
            _context = context;
            _CurrentUserService = currentUserService;
        }

        public async Task<bool> AddStockAsync(StockMovementDto dto)
        {
            var stock = await _repo.GetStockEntryAsync(dto.ProductId, dto.WarehouseId);

            if (stock == null)
            {
                stock = new InventoryStock
                {
                    ProductId = dto.ProductId,
                    WarehouseId = dto.WarehouseId,
                    QuantityOnHand = dto.Quantity,
                    BinLocation = "Receiving"
                };
                await _repo.AddStockAsync(stock);
            }
            else
            {
                stock.QuantityOnHand += dto.Quantity;
                await _repo.UpdateStockAsync(stock);
            }
            return true;
        }

        public async Task<bool> ConsumeStockAsync(StockMovementDto dto)
        {
            var stock = await _repo.GetStockEntryAsync(dto.ProductId, dto.WarehouseId);

            if (stock == null || stock.QuantityOnHand < dto.Quantity)
            {
                throw new InvalidOperationException($"Insufficient Stock. Available: {stock?.QuantityOnHand ?? 0}");
            }

            stock.QuantityOnHand -= dto.Quantity;
            await _repo.UpdateStockAsync(stock);
            return true;
        }

        public async Task<bool> UpdateExactStockAsync(StockMovementDto dto)
        {
            var stock = await _repo.GetStockEntryAsync(dto.ProductId, dto.WarehouseId);
            if (stock == null)
            {
                stock = new InventoryStock
                {
                    ProductId = dto.ProductId,
                    WarehouseId = dto.WarehouseId,
                    QuantityOnHand = dto.Quantity,
                    BinLocation = "Receiving" // Or pass in DTO if needed later
                };
                await _repo.AddStockAsync(stock);
            }
            else
            {
                stock.QuantityOnHand = dto.Quantity;
                await _repo.UpdateStockAsync(stock);
            }
            return true;
        }

        public async Task<bool> DeleteStockAsync(int productId, int warehouseId)
        {
            var stock = await _repo.GetStockEntryAsync(productId, warehouseId);
            if (stock != null)
            {
                _context.InventoryStocks.Remove(stock);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public async Task<List<StockLevelDto>> GetStockLevelsAsync(int productId)
        {
            var stocks = await _repo.GetStockLevelsForProductAsync(productId);
            return stocks.Select(s => new StockLevelDto
            {
                WarehouseId = s.WarehouseId,
                WarehouseName = s.Warehouse?.Name ?? "Unknown",
                Quantity = s.QuantityOnHand,
                BinLocation = s.BinLocation
            }).ToList();
        }

        public async Task TransferStockAsync(int fromWarehouseId, int toWarehouseId, List<StockTransferItem> items)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var item in items)
                {
                    var sourceStock = await _repo.GetStockEntryAsync(item.ProductId, fromWarehouseId);

                    if (sourceStock == null || sourceStock.QuantityOnHand < item.Quantity)
                    {
                        throw new InvalidOperationException($"Not enough stock for Product ID {item.ProductId} at Source Warehouse.");
                    }

                    sourceStock.QuantityOnHand -= item.Quantity;
                    await _repo.UpdateStockAsync(sourceStock);

                    var destStock = await _repo.GetStockEntryAsync(item.ProductId, toWarehouseId);

                    if (destStock == null)
                    {
                        destStock = new InventoryStock
                        {
                            ProductId = item.ProductId,
                            WarehouseId = toWarehouseId,
                            QuantityOnHand = 0,
                            BinLocation = "Transfer In" 
                        };
                        await _repo.AddStockAsync(destStock);
                    }

                    destStock.QuantityOnHand += item.Quantity;
                    await _repo.UpdateStockAsync(destStock);
                }

                var transferRecord = new StockTransfer
                {
                    TransferNumber = $"TRF-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}",
                    FromWarehouseId = fromWarehouseId,
                    ToWarehouseId = toWarehouseId,
                    Status = TransferStatus.Completed,
                    TransferDate = DateTime.UtcNow,
                    TenantId = 1, 
                    Items = items 
                };

                _context.stockTransfers.Add(transferRecord);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        public async Task TransferStockAsync(CreateTransferDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var transferItems = new List<StockTransferItem>();

                foreach (var item in dto.Items)
                {
                    var sourceStock = await _repo.GetStockEntryAsync(item.ProductId, dto.FromWarehouseId);

                    if (sourceStock == null || sourceStock.QuantityOnHand < item.Quantity)
                    {
                        throw new InvalidOperationException($"Insufficient stock for Product ID {item.ProductId}");
                    }

                    sourceStock.QuantityOnHand -= item.Quantity;
                    await _repo.UpdateStockAsync(sourceStock);

                    var destStock = await _repo.GetStockEntryAsync(item.ProductId, dto.ToWarehouseId);

                    if (destStock == null)
                    {
                        destStock = new InventoryStock
                        {
                            ProductId = item.ProductId,
                            WarehouseId = dto.ToWarehouseId,
                            QuantityOnHand = 0,
                            BinLocation = "Transfer In"
                        };
                        await _repo.AddStockAsync(destStock);
                    }

                    destStock.QuantityOnHand += item.Quantity;
                    await _repo.UpdateStockAsync(destStock);

                    transferItems.Add(new StockTransferItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity
                    });
                }

                var transferRecord = new StockTransfer
                {
                    TransferNumber = $"TRF-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                    FromWarehouseId = dto.FromWarehouseId,
                    ToWarehouseId = dto.ToWarehouseId,
                    Status = TransferStatus.Completed,
                    TransferDate = DateTime.UtcNow,
                    Notes = dto.Notes,
                    TenantId = _CurrentUserService.TenantId.Value, 
                    Items = transferItems
                };

                await _repo.AddStockTransferAsync(transferRecord);

       
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        public async Task AdjustStockAsync(CreateAdjustmentDto dto)
        {
            var stock = await _repo.GetStockEntryAsync(dto.ProductId, dto.WarehouseId);

            if (stock == null)
            {
                if (dto.Quantity < 0)
                    throw new InvalidOperationException("Cannot reduce stock that does not exist.");

                stock = new InventoryStock
                {
                    ProductId = dto.ProductId,
                    WarehouseId = dto.WarehouseId,
                    QuantityOnHand = 0,
                    BinLocation = "Adjusted In"
                };
                await _repo.AddStockAsync(stock);
            }

            if (stock.QuantityOnHand + dto.Quantity < 0)
            {
                throw new InvalidOperationException($"Insufficient stock. Current: {stock.QuantityOnHand}, Trying to remove: {Math.Abs(dto.Quantity)}");
            }

            stock.QuantityOnHand += dto.Quantity;
            await _repo.UpdateStockAsync(stock);

            var adj = new StockAdjustment
            {
                AdjustmentNumber = $"ADJ-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}",
                WarehouseId = dto.WarehouseId,
                ProductId = dto.ProductId,
                QuantityAdjusted = dto.Quantity,
                Reason = dto.Reason,
                AdjustmentDate = DateTime.UtcNow,
                TenantId = _CurrentUserService.TenantId.Value
            };

            await _repo.AddStockAdjustmentAsync(adj);
        }
    }
}

