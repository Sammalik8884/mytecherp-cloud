using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    public class MomMeetingService : IMomMeetingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IBlobService _blobService;

        public MomMeetingService(ApplicationDbContext context, ICurrentUserService currentUserService, IBlobService blobService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _blobService = blobService;
        }

        public async Task<MomMeetingDto> GetMeetingByIdAsync(int id)
        {
            var meeting = await _context.Set<MomMeeting>()
                .Include(m => m.Site)
                .Include(m => m.CreatedByUser)
                .Include(m => m.Attendees)
                .Include(m => m.Attachments)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meeting == null) return null;

            return MapToDto(meeting);
        }

        public async Task<List<MomMeetingDto>> GetMeetingsBySiteIdAsync(int siteId)
        {
            var meetings = await _context.Set<MomMeeting>()
                .Include(m => m.Site)
                .Include(m => m.CreatedByUser)
                .Include(m => m.Attendees)
                .Include(m => m.Attachments)
                .Where(m => m.SiteId == siteId)
                .OrderByDescending(m => m.MeetingDate)
                .ToListAsync();

            return meetings.Select(MapToDto).ToList();
        }

        public async Task<MomMeetingDto> CreateMeetingAsync(CreateMomMeetingDto dto)
        {
            var attendeesDto = string.IsNullOrWhiteSpace(dto.AttendeesJson) 
                ? new List<MomAttendeeDto>() 
                : JsonSerializer.Deserialize<List<MomAttendeeDto>>(dto.AttendeesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var meeting = new MomMeeting
            {
                SiteId = dto.SiteId,
                TenantId = _currentUserService.TenantId.GetValueOrDefault(),
                MeetingTitle = dto.MeetingTitle,
                MeetingDate = dto.MeetingDate,
                TimeFrom = dto.TimeFrom,
                TimeTo = dto.TimeTo,
                Location = dto.Location,
                Organizer = dto.Organizer,
                MeetingType = dto.MeetingType,
                Agenda = dto.Agenda,
                DiscussionPoints = dto.DiscussionPoints,
                DecisionsMade = dto.DecisionsMade,
                ActionItems = dto.ActionItems,
                ClosingNotes = dto.ClosingNotes,
                CreatedByUserId = _currentUserService.UserId ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                Attendees = attendeesDto.Select(a => new MomAttendee
                {
                    EmployeeIdStr = a.EmployeeIdStr,
                    EmployeeName = a.EmployeeName,
                    EmployeeStatus = a.EmployeeStatus
                }).ToList()
            };

            foreach (var file in dto.Files)
            {
                if (file.Length > 0)
                {
                    string fileExtension = Path.GetExtension(file.FileName);
                    string fileName = $"momdocs/{_currentUserService.TenantId}/{Guid.NewGuid()}{fileExtension}";
                    var url = await _blobService.UploadAsync(file, fileName);

                    meeting.Attachments.Add(new MomAttachment
                    {
                        FileName = file.FileName,
                        FileUrl = url
                    });
                }
            }

            _context.Set<MomMeeting>().Add(meeting);
            await _context.SaveChangesAsync();

            return await GetMeetingByIdAsync(meeting.Id);
        }

        public async Task DeleteMeetingAsync(int id)
        {
            var meeting = await _context.Set<MomMeeting>().FindAsync(id);
            if (meeting != null)
            {
                meeting.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        private MomMeetingDto MapToDto(MomMeeting meeting)
        {
            return new MomMeetingDto
            {
                Id = meeting.Id,
                SiteId = meeting.SiteId,
                SiteName = meeting.Site?.Name,
                MeetingTitle = meeting.MeetingTitle,
                MeetingDate = meeting.MeetingDate,
                TimeFrom = meeting.TimeFrom,
                TimeTo = meeting.TimeTo,
                Location = meeting.Location,
                Organizer = meeting.Organizer,
                MeetingType = meeting.MeetingType,
                Agenda = meeting.Agenda,
                DiscussionPoints = meeting.DiscussionPoints,
                DecisionsMade = meeting.DecisionsMade,
                ActionItems = meeting.ActionItems,
                ClosingNotes = meeting.ClosingNotes,
                CreatedAt = meeting.CreatedAt,
                CreatedByUserName = meeting.CreatedByUser?.UserName ?? string.Empty,
                Attendees = meeting.Attendees.Select(a => new MomAttendeeDto
                {
                    Id = a.Id,
                    EmployeeIdStr = a.EmployeeIdStr,
                    EmployeeName = a.EmployeeName,
                    EmployeeStatus = a.EmployeeStatus
                }).ToList(),
                Attachments = meeting.Attachments.Select(a => new MomAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FileUrl = _blobService.GenerateSasUrl(a.FileUrl, 60, false),
                    DownloadUrl = _blobService.GenerateSasUrl(a.FileUrl, 60, true)
                }).ToList()
            };
        }
    }
}
