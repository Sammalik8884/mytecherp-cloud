using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface IMeetingMinutesExecutionService
    {
        Task<MeetingMinutesExecutionDto> GetMeetingByIdAsync(int id);
        Task<List<MeetingMinutesExecutionDto>> GetAllMeetingsAsync();
        Task<List<MeetingMinutesExecutionDto>> GetMeetingsBySiteIdAsync(int siteId);
        Task<MeetingMinutesExecutionDto> CreateMeetingAsync(CreateMeetingMinutesExecutionDto dto);
        Task<MeetingMinutesExecutionDto> UpdateMeetingAsync(int id, CreateMeetingMinutesExecutionDto dto);
        Task DeleteMeetingAsync(int id);
    }
}
