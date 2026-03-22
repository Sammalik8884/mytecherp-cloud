using Microsoft.EntityFrameworkCore;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Inventory;
using MytechERP.Infrastructure.Persistance;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public class WarehouseRepository : IWarehouseRepository
    {
        private readonly ApplicationDbContext _context;

        public WarehouseRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Warehouse>> GetAllAsync(int tenantId)
        {
            return await _context.Warehouses
                .Where(w => w.TenantId == tenantId)
                .OrderByDescending(w => w.Id)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Warehouse?> GetByIdAsync(int id, int tenantId)
        {
            return await _context.Warehouses
                .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
        }

        public async Task AddAsync(Warehouse warehouse)
        {
            await _context.Warehouses.AddAsync(warehouse);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Warehouse warehouse)
        {
            _context.Warehouses.Update(warehouse);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Warehouse warehouse)
        {
            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();
        }
    }
}
