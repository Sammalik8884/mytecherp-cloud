using MytechERP.Application.DTOs.SalesInvoices;

namespace MytechERP.Application.Interfaces
{
    public interface ISalesInvoicePdfService
    {
        byte[] GeneratePdf(SalesInvoiceDto invoice);
    }
}
