using MytechERP.Application.DTOs.Finance;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IArfReturnService
    {
        Task<List<ArfReturnDto>> GetAllAsync();
        Task<ArfReturnDto> CreateAsync(CreateArfReturnDto dto);
        Task<decimal> GetDebtBalanceAsync(string email);
    }
}
