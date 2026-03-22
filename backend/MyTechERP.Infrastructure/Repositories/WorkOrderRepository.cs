using Microsoft.EntityFrameworkCore;
using MytechERP.domain.Entities;
using MytechERP.domain.Interfaces;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public class WorkOrderRepository : IWorkOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public WorkOrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WorkOrder> AddAsync(WorkOrder workOrder)
        {
            _context.WorkOrders.Add(workOrder);
            await _context.SaveChangesAsync();
            return workOrder;
        }

        public async Task<WorkOrder?> GetByIdAsync(int id)
        {
            return await _context.WorkOrders
                .Include(w => w.Contract)              
                .ThenInclude(c => c.Customer)          
                .Include(w => w.Technician)            
                .Include(w => w.TimeLogs)
                .FirstOrDefaultAsync(w => w.Id == id);
        }

        public async Task<List<WorkOrder>> GetAllAsync(MytechERP.domain.Common.PaginationParams filter)
        {
            return await _context.WorkOrders
                .Include(w => w.Contract)
                    .ThenInclude(c => c.Customer)
                .Include(w => w.ReferenceQuotation)
                    .ThenInclude(q => q.Customer)
                .Include(w => w.Asset)
                    .ThenInclude(a => a.Site)
                .Include(w => w.Technician)
                .Include(w => w.TimeLogs)
                .OrderByDescending(w => w.Id)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();
        }

        public async Task UpdateAsync(WorkOrder workOrder)
        {
            _context.WorkOrders.Update(workOrder);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.WorkOrders.FindAsync(id);
            if (entity != null)
            {
                _context.WorkOrders.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

       

        public async Task<List<WorkOrder>> GetByTechnicianAsync(string technicianId)
        {
            return await _context.WorkOrders
                .Where(w => w.TechnicianId == technicianId)
                .Include(w => w.Contract)
                .ThenInclude(c => c.Customer) 
                .Include(w => w.TimeLogs)
                .OrderBy(w => w.ScheduledDate)
                .ToListAsync();
        }

        public async Task<List<WorkOrder>> GetByContractAsync(int contractId)
        {
            return await _context.WorkOrders
                .Where(w => w.ContractId == contractId)
                .OrderByDescending(w => w.ScheduledDate)
                .ToListAsync();
        }
    }
}

