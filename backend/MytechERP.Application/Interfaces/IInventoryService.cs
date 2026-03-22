using MytechERP.Application.DTOs.Inventory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IInventoryService
    {
        Task<bool> AddStockAsync(StockMovementDto dto);
        Task<bool> ConsumeStockAsync(StockMovementDto dto);
        Task<List<StockLevelDto>> GetStockLevelsAsync(int productId);
        Task AdjustStockAsync(CreateAdjustmentDto dto);
        Task TransferStockAsync(CreateTransferDto dto);
        Task<bool> UpdateExactStockAsync(StockMovementDto dto);
        Task<bool> DeleteStockAsync(int productId, int warehouseId);
    }

}
