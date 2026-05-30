using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IProjectTechnicalHandoverService
    {
        Task<IEnumerable<ProjectTechnicalHandoverDto>> GetAllAsync();
        Task<IEnumerable<ProjectTechnicalHandoverDto>> GetBySiteIdAsync(int siteId);
        Task<ProjectTechnicalHandoverDto> GetByIdAsync(int id);
        Task<ProjectTechnicalHandoverDto> CreateAsync(CreateProjectTechnicalHandoverDto dto, string userId);
        Task<ProjectTechnicalHandoverDto> UpdateAsync(int id, CreateProjectTechnicalHandoverDto dto, string userId);
        Task DeleteAsync(int id);
    }
}
