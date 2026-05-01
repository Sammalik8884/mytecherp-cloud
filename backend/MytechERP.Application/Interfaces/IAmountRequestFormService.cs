using MytechERP.Application.DTOs.Finance;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IAmountRequestFormService
    {
        Task<AmountRequestFormDto> GetByIdAsync(int id);
        Task<List<AmountRequestFormDto>> GetAllAsync();
        Task<AmountRequestFormDto> CreateAsync(CreateAmountRequestFormDto dto);
        Task<AmountRequestFormDto> ApproveAsync(int id, ApproveAmountRequestDto dto);
        Task<AmountRequestFormDto> ReleaseAmountAsync(int id, AccountsReleaseAmountDto dto);
        Task<AmountRequestFormDto> AddPaymentAsync(int id, CreateAmountRequestPaymentDto dto);
        Task DeleteAsync(int id);
    }
}
