using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IMaterialReceivingService
    {
        Task<MaterialReceivingFormDto> GetFormByIdAsync(int id);
        Task<List<MaterialReceivingFormDto>> GetFormsBySiteIdAsync(int siteId);
        Task<List<MaterialReceivingFormDto>> GetFormsByLocationAsync(string location);
        Task<MaterialReceivingFormDto> CreateFormAsync(CreateMaterialReceivingFormDto dto);
        Task<MaterialReceivingFormDto> UpdateFormAsync(int id, CreateMaterialReceivingFormDto dto);
        Task DeleteFormAsync(int id);
    }
}
