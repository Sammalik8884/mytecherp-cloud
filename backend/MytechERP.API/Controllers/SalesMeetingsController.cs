using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.sales;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;
using System.Security.Claims;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SalesMeetingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SalesMeetingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetings()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRoles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

            var isAdmin = userRoles.Contains("Admin") || userRoles.Contains("Manager") || userRoles.Contains("CEO") || userRoles.Contains("Project Director");

            var query = _context.SalesMeetingReminders.Include(m => m.SalesmanUser).AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(m => m.SalesmanUserId == userId);
            }

            var meetings = await query
                .OrderBy(m => m.MeetingDate)
                .Select(m => new SalesMeetingReminderDto
                {
                    Id = m.Id,
                    SalesmanUserId = m.SalesmanUserId,
                    SalesmanName = m.SalesmanUser != null ? m.SalesmanUser.FullName : "Unknown",
                    SiteName = m.SiteName,
                    MeetingDate = m.MeetingDate,
                    IsTimeIncluded = m.IsTimeIncluded,
                    IsNotified = m.IsNotified,
                    IsPopupAcknowledged = m.IsPopupAcknowledged,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();

            return Ok(meetings);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] CreateSalesMeetingReminderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var meeting = new SalesMeetingReminder
            {
                SalesmanUserId = userId,
                SiteName = dto.SiteName,
                MeetingDate = dto.MeetingDate,
                IsTimeIncluded = dto.IsTimeIncluded,
                IsNotified = false,
                IsPopupAcknowledged = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesMeetingReminders.Add(meeting);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Meeting scheduled successfully." });
        }

        [HttpGet("pending-alerts")]
        public async Task<IActionResult> GetPendingAlerts()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var alerts = await _context.SalesMeetingReminders
                .Where(m => m.SalesmanUserId == userId && m.IsNotified == true && m.IsPopupAcknowledged == false)
                .Select(m => new SalesMeetingReminderDto
                {
                    Id = m.Id,
                    SalesmanUserId = m.SalesmanUserId,
                    SiteName = m.SiteName,
                    MeetingDate = m.MeetingDate,
                    IsTimeIncluded = m.IsTimeIncluded
                })
                .ToListAsync();

            return Ok(alerts);
        }

        [HttpPost("{id}/acknowledge-popup")]
        public async Task<IActionResult> AcknowledgePopup(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var meeting = await _context.SalesMeetingReminders.FirstOrDefaultAsync(m => m.Id == id && m.SalesmanUserId == userId);

            if (meeting == null)
            {
                return NotFound();
            }

            meeting.IsPopupAcknowledged = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Alert acknowledged." });
        }
    }
}
