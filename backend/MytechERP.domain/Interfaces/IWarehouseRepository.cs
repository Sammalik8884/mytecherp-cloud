using MytechERP.domain.Inventory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Interfaces
{
    public interface IWarehouseRepository
    {
        Task<List<Warehouse>> GetAllAsync(int tenantId);
        Task<Warehouse?> GetByIdAsync(int id, int tenantId);
        Task AddAsync(Warehouse warehouse);
        Task UpdateAsync(Warehouse warehouse);
        Task DeleteAsync(Warehouse warehouse);
    }
}
