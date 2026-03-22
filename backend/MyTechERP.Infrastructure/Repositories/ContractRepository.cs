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
    public class ContractRepository :IContractRepository
    {
        private readonly ApplicationDbContext _context;
        public ContractRepository(ApplicationDbContext context)
        {  _context = context; }
        public async Task AddContractItemAsync(ContractItem item)
        {
         
            await _context.Set<ContractItem>().AddAsync(item);
            await _context.SaveChangesAsync();
        }
        public async Task<List<Contract>> GetAllAsync()
        {
            
            return await _context.Contracts
                .Include(c => c.Customer)
                .OrderByDescending(c => c.Id)
                .ToListAsync();
        }
        public async Task<Contract?> GetByIdAsync(int id)
        {
            return await _context.Contracts
                .Include(c => c.Customer).Include(c => c.ContractItems)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Contract> AddAsync(Contract contract)
        {
            await _context.AddAsync(contract);
            await _context.SaveChangesAsync();
            return contract;
        }
        public async Task<bool> ExistsAsync(int id)
        {
            await _context.Contracts.AnyAsync(x => x.Id == id);
            return true;
        }
        public async Task UpdateAsync(Contract contract)
        {
            _context.Contracts.Update(contract);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Contracts.FindAsync(id);
            if (entity != null)
            {
                _context.Contracts.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
        public async Task DeleteContractItemAsync(int id)
        {
            var item = await _context.ContractItems.FindAsync(id);
            if (item != null)
            {
                 _context.Remove(item);
                await _context.SaveChangesAsync();
            }
        }
    }
}
