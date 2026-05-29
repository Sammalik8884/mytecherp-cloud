using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IDailyProgressReportPdfService
    {
        Task<byte[]> GeneratePdfAsync(DailyProgressReportDto report);
    }
}
