using MytechERP.Application.DTOs.Finance;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace MytechERP.Application.Interfaces
{
    public interface IChequeService
    {
        Task<List<ChequeDto>> GetAllAsync();
        Task<ChequeDto> GetByIdAsync(int id);
        Task<ChequeDto> CreateAsync(CreateChequeDto dto);
        Task<ChequeDto> UpdateAsync(int id, UpdateChequeDto dto);
        Task DeleteAsync(int id);
        Task<string> UploadPictureAsync(IFormFile file);
        Task<ChequeLedgerDto> GetLedgerAsync(int id);
    }
}
