using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IItemProcurementService
    {
        Task<ItemProcurementDto> GetItemProcurementByIdAsync(int id);
        Task<List<ItemProcurementDto>> GetAllItemProcurementsAsync(int? siteId = null);
        Task<ItemProcurementDto> CreateItemProcurementAsync(CreateItemProcurementDto dto);
        Task<ItemProcurementDto> UpdateItemProcurementAsync(int id, CreateItemProcurementDto dto);
        Task<bool> DeleteItemProcurementAsync(int id);
    }
}
