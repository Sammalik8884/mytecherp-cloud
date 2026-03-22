using MytechERP.Application.DTOs.Quotations;
using MytechERP.Application.DTOs.sales;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IQuotationService

    {
        Task<string> SubmitForApprovalAsync(int id);
        Task<string> ApproveAsync(int id, string userId);
        Task<string> RejectAsync(int id, string comment);
        Task UpdateQuotationAsync(int id, UpdateQuotationRequest request);
        Task<QuotationDto> CreateQuoteAsync(CreateQuotationDto dto);

        Task<QuotationDto?> GetQuoteByIdAsync(int id);

        Task<IEnumerable<QuotationDto>> GetAllQuotesAsync();

        Task<QuotationDto> UpdateQuoteAsync(int id, CreateQuotationDto dto);

        Task DeleteQuoteAsync(int id);
        Task<int> CreateQuoteFromFailureAsync(ConvertFailureToQuoteDto dto, string userId);
    }
}