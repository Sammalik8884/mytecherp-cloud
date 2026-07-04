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
        Task<ExpenseDto> UpdateAsync(int id, CreateExpenseDto dto);
        Task<ExpenseDto> ReviewExpenseAsync(int id, ExpenseReviewDto dto, string reviewerEmail);
        Task DeleteAsync(int id);
    }
}
