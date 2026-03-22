using MytechERP.domain.Inventory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Interfaces
{
    public interface IInventoryRepository
    {
        Task<InventoryStock?> GetStockEntryAsync(int productId, int warehouseId);
        Task AddStockAsync(InventoryStock stock);
        Task UpdateStockAsync(InventoryStock stock);
        Task<List<InventoryStock>> GetStockLevelsForProductAsync(int productId);

        Task AddStockTransferAsync(StockTransfer transfer);
        Task AddStockAdjustmentAsync(StockAdjustment adjustment);
    }
}
