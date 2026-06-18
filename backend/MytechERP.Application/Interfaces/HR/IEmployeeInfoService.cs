using MytechERP.Application.DTOs.HR;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces.HR
{
    public interface IEmployeeInfoService
    {
        Task<List<EmployeeInfoDto>> GetAllAsync(string? search = null);
        Task<EmployeeInfoDto> GetByIdAsync(int id);
        Task<EmployeeInfoDto> CreateAsync(CreateEmployeeInfoDto dto, string userId);
        Task<EmployeeInfoDto> UpdateAsync(int id, CreateEmployeeInfoDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
