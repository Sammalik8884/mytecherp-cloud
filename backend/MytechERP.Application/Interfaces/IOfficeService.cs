using MytechERP.Application.DTOs.CRM;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IOfficeService
    {
        Task<List<OfficeDto>> GetAllAsync();
        Task<OfficeDto> GetByIdAsync(int id);
        Task<OfficeDto> CreateAsync(CreateOfficeDto dto);
        Task<OfficeDto> UpdateAsync(int id, CreateOfficeDto dto);
        Task DeleteAsync(int id);
    }
}
