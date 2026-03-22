using Microsoft.EntityFrameworkCore;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Interfaces;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public class AssetRepository : IAssetRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Asset> AddAsync(Asset asset)
        {
            await _context.Assets.AddAsync(asset);
            await _context.SaveChangesAsync();
            return asset;
        }

        public async Task<List<Asset>> GetAllAsync()
        {
            return await _context.Assets.Include(a => a.Site).ToListAsync();
        }

        public async Task<Asset?> GetIdAsync(int id)
        {
            return await _context.Assets
                .Include(a => a.Site)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task UpdateAsync(Asset asset)
        {
            _context.Assets.Update(asset);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset != null)
            {
                _context.Assets.Remove(asset);
                await _context.SaveChangesAsync();
            }
        }
    }
}
