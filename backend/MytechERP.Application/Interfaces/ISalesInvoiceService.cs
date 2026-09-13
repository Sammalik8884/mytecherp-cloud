using MytechERP.Application.DTOs.SalesInvoices;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ISalesInvoiceService
    {
        Task<SalesInvoiceDto> CreateInvoiceAsync(CreateSalesInvoiceDto dto, string userId);
        Task<SalesInvoiceDto> GetInvoiceByIdAsync(int id);
        Task<IEnumerable<SalesInvoiceDto>> GetAllInvoicesAsync();
        Task DeleteInvoiceAsync(int id);
        Task<byte[]> GeneratePdfAsync(int id);
    }
}
