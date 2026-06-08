using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public class ToolBoxTalkRepository : IToolBoxTalkRepository
    {
        private readonly ApplicationDbContext _context;

        public ToolBoxTalkRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ToolBoxTalk>> GetAllAsync()
        {
            return await _context.ToolBoxTalks
                .Include(t => t.Site)
                .Include(t => t.Attendees)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<ToolBoxTalk?> GetByIdAsync(int id)
        {
            return await _context.ToolBoxTalks
                .Include(t => t.Site)
                .Include(t => t.Attendees)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<ToolBoxTalk> AddAsync(ToolBoxTalk toolBoxTalk)
        {
            await _context.ToolBoxTalks.AddAsync(toolBoxTalk);
            await _context.SaveChangesAsync();
            return toolBoxTalk;
        }

        public async Task UpdateAsync(ToolBoxTalk toolBoxTalk)
        {
            _context.ToolBoxTalks.Update(toolBoxTalk);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ToolBoxTalk toolBoxTalk)
        {
            _context.ToolBoxTalks.Remove(toolBoxTalk);
            await _context.SaveChangesAsync();
        }

        public async Task<ToolBoxTalkAttendee?> GetAttendeeByIdAsync(int id)
        {
            return await _context.ToolBoxTalkAttendees.FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task UpdateAttendeeAsync(ToolBoxTalkAttendee attendee)
        {
            _context.ToolBoxTalkAttendees.Update(attendee);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAttendeeAsync(ToolBoxTalkAttendee attendee)
        {
            _context.ToolBoxTalkAttendees.Remove(attendee);
            await _context.SaveChangesAsync();
        }
    }
}
