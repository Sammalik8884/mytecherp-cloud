using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IDailyProgressReportService
    {
        Task<DailyProgressReportDto> CreateAsync(CreateDailyProgressReportDto dto);
        Task<List<DailyProgressReportDto>> GetBySiteIdAsync(int siteId);
        Task<DailyProgressReportDto> GetByIdAsync(int id);
        Task DeleteAsync(int id);
    }
}