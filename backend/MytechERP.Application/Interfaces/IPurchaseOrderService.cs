using MytechERP.Application.DTOs.Inventory;
using MytechERP.domain.Inventory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IPurchaseOrderService
    {
        Task<List<Vendor>> GetAllVendorsAsync();
        Task<List<PurchaseOrderDto>> GetAllPOsAsync();
        Task<Vendor> CreateVendorAsync(CreateVendorDto dto);
        Task<Vendor> UpdateVendorAsync(int id, UpdateVendorDto dto);
        Task DeleteVendorAsync(int id);
        Task<PurchaseOrder> CreatePOAsync(CreatePODto dto);
        Task<PurchaseOrder> UpdatePOAsync(int id, UpdatePODto dto);
        Task DeletePOAsync(int id);
        Task SendPOToVendorAsync(int poId);
        Task ReceivePOAsync(int poId);
        Task MarkAsSentAsync(int poId);
    }
}
