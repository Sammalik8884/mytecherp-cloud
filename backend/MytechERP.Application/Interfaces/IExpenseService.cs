using MytechERP.Application.DTOs.Finance;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IExpenseService
    {
        Task<ExpenseDto> GetByIdAsync(int id);
        Task<List<ExpenseDto>> GetAllAsync();
        Task<List<ExpenseDto>> GetBySiteIdAsync(int siteId);
        Task<ExpenseDto> CreateAsync(CreateExpenseDto dto);
        Task DeleteAsync(int id);
    }
}
