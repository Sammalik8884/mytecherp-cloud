using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IIncidentRecordService
    {
        Task<IncidentRecordDto> CreateAsync(CreateIncidentRecordDto dto, string userId);
        Task<IncidentRecordDto> UpdateAsync(int id, CreateIncidentRecordDto dto, string userId);
        Task<IncidentRecordDto> GetByIdAsync(int id);
        Task<IEnumerable<IncidentRecordDto>> GetAllAsync();
        Task DeleteAsync(int id);
    }
}
