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
    public class PurchaseOrderRepository : IPurchaseOrderRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly MytechERP.Application.Interfaces.ICurrentUserService _currentUserService;

        public PurchaseOrderRepository(ApplicationDbContext context, MytechERP.Application.Interfaces.ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<Vendor> CreateVendorAsync(Vendor vendor)
        {
            _context.Vendors.Add(vendor);
            await _context.SaveChangesAsync();
            return vendor;
        }

        public async Task<List<Vendor>> GetAllVendorsAsync()
        {
            return await _context.Vendors.AsNoTracking().Where(v => !v.IsDeleted).OrderByDescending(v => v.Id).ToListAsync();
        }

        public async Task<Vendor?> GetVendorByIdAsync(int id)
        {
            return await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);
        }

        public async Task UpdateVendorAsync(Vendor vendor)
        {
            _context.Vendors.Update(vendor);
            await _context.SaveChangesAsync();
        }

        public async Task<List<PurchaseOrder>> GetAllPOsAsync()
        {
            // Avoid INNER JOINs with filtered entities (Vendor, Warehouse) 
            // which cause the entire query to return 0 rows silently.
            // Load POs with Items only, then enrich vendor/product names separately.
            return await _context.PurchaseOrders
                .Include(p => p.Items)
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(p => p.TenantId == _currentUserService.TenantId && !p.IsDeleted)
                .OrderByDescending(p => p.Id)
                .ToListAsync();
        }

        public async Task<Dictionary<int, string>> GetVendorNamesByTenantAsync(int tenantId)
        {
            return await _context.Vendors
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(v => v.TenantId == tenantId && !v.IsDeleted)
                .ToDictionaryAsync(v => v.Id, v => v.Name);
        }

        public async Task<Warehouse?> GetWarehouseByIdAsync(int warehouseId)
        {
            return await _context.Warehouses
                .AsNoTracking()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(w => w.Id == warehouseId);
        }

        public async Task<PurchaseOrder> CreatePOAsync(PurchaseOrder po)
        {
            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();
            return po;
        }

        public async Task<PurchaseOrder?> GetPOByIdAsync(int id)
        {
            return await _context.PurchaseOrders
                .Include(p => p.Items)
                .Include(p => p.Vendor)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == _currentUserService.TenantId && !p.IsDeleted);
        }

        public async Task UpdatePOAsync(PurchaseOrder po)
        {
            _context.PurchaseOrders.Update(po);
            await _context.SaveChangesAsync();
        }

        public async Task DeletePOAsync(int id)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po != null)
            {
                po.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }
    }
}

