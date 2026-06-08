using MytechERP.domain.Entities.CRM;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IToolBoxTalkRepository
    {
        Task<IEnumerable<ToolBoxTalk>> GetAllAsync();
        Task<ToolBoxTalk?> GetByIdAsync(int id);
        Task<ToolBoxTalk> AddAsync(ToolBoxTalk toolBoxTalk);
        Task UpdateAsync(ToolBoxTalk toolBoxTalk);
        Task DeleteAsync(ToolBoxTalk toolBoxTalk);
        
        Task<ToolBoxTalkAttendee?> GetAttendeeByIdAsync(int id);
        Task UpdateAttendeeAsync(ToolBoxTalkAttendee attendee);
        Task DeleteAttendeeAsync(ToolBoxTalkAttendee attendee);
    }
}
