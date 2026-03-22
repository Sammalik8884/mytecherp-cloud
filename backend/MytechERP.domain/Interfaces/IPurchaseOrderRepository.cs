using MytechERP.domain.Inventory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Interfaces
{
    public interface IPurchaseOrderRepository
    {
        Task<Vendor> CreateVendorAsync(Vendor vendor);
        Task<List<Vendor>> GetAllVendorsAsync();
        Task<Vendor?> GetVendorByIdAsync(int id);
        Task UpdateVendorAsync(Vendor vendor);
        Task<List<PurchaseOrder>> GetAllPOsAsync();
        Task<PurchaseOrder> CreatePOAsync(PurchaseOrder po);
        Task<PurchaseOrder?> GetPOByIdAsync(int id);
        Task UpdatePOAsync(PurchaseOrder po);
        Task DeletePOAsync(int id);
        Task<Warehouse?> GetWarehouseByIdAsync(int warehouseId);
        Task<Dictionary<int, string>> GetVendorNamesByTenantAsync(int tenantId);
    }
}
