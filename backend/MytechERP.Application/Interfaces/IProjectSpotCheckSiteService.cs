using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IProjectSpotCheckSiteService
    {
        Task<ProjectSpotCheckSiteDto> CreateAsync(CreateProjectSpotCheckSiteDto dto, string userId);
        Task<ProjectSpotCheckSiteDto> UpdateAsync(int id, CreateProjectSpotCheckSiteDto dto, string userId);
        Task<ProjectSpotCheckSiteDto> GetByIdAsync(int id);
        Task<IEnumerable<ProjectSpotCheckSiteDto>> GetAllAsync();
        Task DeleteAsync(int id);
    }
}
