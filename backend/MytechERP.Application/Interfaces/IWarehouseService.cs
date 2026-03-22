using MytechERP.Application.DTOs.Inventory;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IWarehouseService
    {
        Task<List<WarehouseDto>> GetAllAsync();
        Task<WarehouseDto?> GetByIdAsync(int id);
        Task<WarehouseDto> CreateAsync(CreateWarehouseDto dto);
        Task<bool> UpdateAsync(int id, UpdateWarehouseDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
