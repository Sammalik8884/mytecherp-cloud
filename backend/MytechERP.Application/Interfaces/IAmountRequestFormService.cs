using MytechERP.Application.DTOs.Finance;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IAmountRequestFormService
    {
        Task<AmountRequestFormDto> GetByIdAsync(int id);
        Task<List<AmountRequestFormDto>> GetAllAsync();
        Task<List<AmountRequestFormDto>> GetPendingForAccountsAsync();
        Task<List<AmountRequestFormDto>> GetHistoryForAccountsAsync();
        Task<AmountRequestFormDto> CreateAsync(CreateAmountRequestFormDto dto);
        Task<AmountRequestFormDto> ApproveAsync(int id, ApproveAmountRequestDto dto);
        Task<AmountRequestFormDto> ReleaseAmountAsync(int id, AccountsReleaseAmountDto dto);
        Task<AmountRequestFormDto> AddPaymentAsync(int id, CreateAmountRequestPaymentDto dto);
        Task<AmountRequestFormDto> UploadAttachmentAsync(int id, Microsoft.AspNetCore.Http.IFormFile file);
        Task DeleteAsync(int id);
    }
}
