using MytechERP.domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Interfaces
{
    public interface IWorkOrderRepository
    {
        Task<WorkOrder> AddAsync(WorkOrder workOrder);
        Task<WorkOrder?> GetByIdAsync(int id);
        Task<List<WorkOrder>> GetAllAsync(MytechERP.domain.Common.PaginationParams filter);
        Task UpdateAsync(WorkOrder workOrder);
        Task DeleteAsync(int id);

     
        Task<List<WorkOrder>> GetByTechnicianAsync(string technicianId);
        Task<List<WorkOrder>> GetByContractAsync(int contractId);

    }
}
