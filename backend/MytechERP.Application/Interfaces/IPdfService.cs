using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IPdfService
    {
        Task<byte[]> GeneratePayslipPdfAsync(int payslipId);
        Task<byte[]> GenerateContractPdfAsync(int contractId);
        Task<byte[]> GenerateInvoicePdfAsync(int invoiceId);
        Task<byte[]> GeneratePurchaseOrderPdfAsync(int poId);
        Task<byte[]> GenerateSalesmanActivityReportPdfAsync(MytechERP.Application.DTOs.Dashboard.SalesmanActivityResponseDto data);
    }
}
