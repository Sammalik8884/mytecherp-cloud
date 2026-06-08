using MytechERP.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IToolBoxTalkService
    {
        Task<IEnumerable<ToolBoxTalkDto>> GetAllAsync();
        Task<ToolBoxTalkDto?> GetByIdAsync(int id);
        Task<ToolBoxTalkDto> CreateAsync(ToolBoxTalkDto dto);
        Task UpdateAsync(int id, ToolBoxTalkDto dto);
        Task DeleteAsync(int id);
        
        Task UpdateAttendeeAsync(int attendeeId, ToolBoxTalkAttendeeDto dto);
        Task DeleteAttendeeAsync(int attendeeId);
    }
}
