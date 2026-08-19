using MytechERP.Application.DTOs.Quotations;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ISupplyQuotationService
    {
        Task<SupplyQuotationDto> GetSupplyQuotationByIdAsync(int id);
        Task<List<SupplyQuotationDto>> GetAllSupplyQuotationsAsync();
        Task<SupplyQuotationDto> CreateSupplyQuotationAsync(CreateSupplyQuotationDto dto, string userId);
        Task<SupplyQuotationDto> UpdateSupplyQuotationAsync(int id, CreateSupplyQuotationDto dto);
        Task DeleteSupplyQuotationAsync(int id);
        
        Task<byte[]> GeneratePdfAsync(int id);
        Task<byte[]> GenerateExcelAsync(int id);
    }
}
