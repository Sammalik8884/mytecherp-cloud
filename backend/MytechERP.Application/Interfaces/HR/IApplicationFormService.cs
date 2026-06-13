using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.HR;

namespace MytechERP.Application.Interfaces.HR
{
    public interface IApplicationFormService
    {
        Task<ApplicationFormDto> CreateAsync(CreateApplicationFormDto dto, string userId);
        Task<List<ApplicationFormDto>> GetAllAsync(string userRole, string userEmail);
        Task<ApplicationFormDto> GetByIdAsync(int id);
        Task<ApplicationFormDto> UpdateStatusAsync(int id, UpdateApplicationFormStatusDto dto, string userEmail);
        Task DeleteAsync(int id);
    }
}
