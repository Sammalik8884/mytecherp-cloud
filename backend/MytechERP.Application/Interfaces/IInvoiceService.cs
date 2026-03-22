using MytechERP.domain.Entities.Finance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.Finance;

namespace MytechERP.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<Invoice> CreateFromQuotationAsync(int quotationId);
        Task<InvoiceDto> CreateCustomInvoiceAsync(CreateInvoiceDto dto, string tenantId);
        Task<int> GenerateInvoiceFromJobAsync(int workOrderId);
        Task<IEnumerable<InvoiceDto>> GetAllAsync(string tenantId);
        Task<InvoiceDto> GetByIdAsync(int id, string tenantId);
        Task<bool> UpdateStatusAsync(int id, int status, string tenantId);
        Task<IEnumerable<InvoiceDto>> GetByCustomerEmailAsync(string email);
    }
}
