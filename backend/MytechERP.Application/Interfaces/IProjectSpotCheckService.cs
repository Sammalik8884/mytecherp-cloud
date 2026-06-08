using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IProjectSpotCheckService
    {
        Task<ProjectSpotCheckDto?> GetByIdAsync(int id);
        Task<IEnumerable<ProjectSpotCheckDto>> GetAllAsync();
        Task<ProjectSpotCheckDto> CreateAsync(CreateProjectSpotCheckDto dto);
        Task<ProjectSpotCheckDto> UpdateAsync(int id, CreateProjectSpotCheckDto dto);
        Task DeleteAsync(int id);
    }
}
