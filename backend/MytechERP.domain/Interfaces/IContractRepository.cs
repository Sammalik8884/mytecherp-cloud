using MytechERP.domain.Entities.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Interfaces
{
    public interface IContractRepository
    {
        Task<Contract> AddAsync(Contract contract);
        Task<bool> ExistsAsync(int id);
        Task<List<Contract>> GetAllAsync();
        Task<Contract?> GetByIdAsync(int id);
        Task UpdateAsync(Contract contract);
        Task DeleteAsync(int id);
        Task AddContractItemAsync(ContractItem item);
        Task   DeleteContractItemAsync(int id);
    }
}
