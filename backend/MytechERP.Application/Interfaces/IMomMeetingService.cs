using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IMomMeetingService
    {
        Task<MomMeetingDto> GetMeetingByIdAsync(int id);
        Task<List<MomMeetingDto>> GetAllMeetingsAsync();
        Task<List<MomMeetingDto>> GetMeetingsBySiteIdAsync(int siteId);
        Task<MomMeetingDto> CreateMeetingAsync(CreateMomMeetingDto dto);
        Task DeleteMeetingAsync(int id);
    }
}
