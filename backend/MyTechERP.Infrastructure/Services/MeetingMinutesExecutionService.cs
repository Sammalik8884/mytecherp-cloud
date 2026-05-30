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
    public class MeetingMinutesExecutionService : IMeetingMinutesExecutionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IBlobService _blobService;

        public MeetingMinutesExecutionService(ApplicationDbContext context, ICurrentUserService currentUserService, IBlobService blobService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _blobService = blobService;
        }

        public async Task<MeetingMinutesExecutionDto> GetMeetingByIdAsync(int id)
        {
            var meeting = await _context.Set<MeetingMinutesExecution>()
                .Include(m => m.Site)
                .Include(m => m.CreatedByUser)
                .Include(m => m.Attendees)
                .Include(m => m.Attachments)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meeting == null) return null;

            return MapToDto(meeting);
        }

        public async Task<List<MeetingMinutesExecutionDto>> GetAllMeetingsAsync()
        {
            var meetings = await _context.Set<MeetingMinutesExecution>()
                .Include(m => m.Site)
                .Include(m => m.CreatedByUser)
                .Include(m => m.Attendees)
                .Include(m => m.Attachments)
                .OrderByDescending(m => m.MeetingDate)
                .ToListAsync();

            return meetings.Select(MapToDto).ToList();
        }

        public async Task<List<MeetingMinutesExecutionDto>> GetMeetingsBySiteIdAsync(int siteId)
        {
            var meetings = await _context.Set<MeetingMinutesExecution>()
                .Include(m => m.Site)
                .Include(m => m.CreatedByUser)
                .Include(m => m.Attendees)
                .Include(m => m.Attachments)
                .Where(m => m.SiteId == siteId)
                .OrderByDescending(m => m.MeetingDate)
                .ToListAsync();

            return meetings.Select(MapToDto).ToList();
        }

        public async Task<MeetingMinutesExecutionDto> CreateMeetingAsync(CreateMeetingMinutesExecutionDto dto)
        {
            var attendeesDto = string.IsNullOrWhiteSpace(dto.AttendeesJson) 
                ? new List<MeetingMinutesExecutionAttendeeDto>() 
                : JsonSerializer.Deserialize<List<MeetingMinutesExecutionAttendeeDto>>(dto.AttendeesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var meeting = new MeetingMinutesExecution
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
                Attendees = attendeesDto.Select(a => new MeetingMinutesExecutionAttendee
                {
                    EmployeeIdStr = a.EmployeeIdStr,
                    EmployeeName = a.EmployeeName,
                    EmployeeStatus = a.EmployeeStatus
                }).ToList()
            };

            foreach (var file in dto.Attachments)
            {
                if (file.Length > 0)
                {
                    string fileExtension = Path.GetExtension(file.FileName);
                    string fileName = $"momdocs/{_currentUserService.TenantId}/{Guid.NewGuid()}{fileExtension}";
                    var url = await _blobService.UploadAsync(file, fileName);

                    meeting.Attachments.Add(new MeetingMinutesExecutionAttachment
                    {
                        FileName = file.FileName,
                        FileUrl = url
                    });
                }
            }

            _context.Set<MeetingMinutesExecution>().Add(meeting);
            await _context.SaveChangesAsync();

            return await GetMeetingByIdAsync(meeting.Id);
        }

        public async Task<MeetingMinutesExecutionDto> UpdateMeetingAsync(int id, CreateMeetingMinutesExecutionDto dto)
        {
            var meeting = await _context.Set<MeetingMinutesExecution>()
                .Include(m => m.Attendees)
                .Include(m => m.Attachments)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meeting == null) return null;

            var attendeesDto = string.IsNullOrWhiteSpace(dto.AttendeesJson) 
                ? new List<MeetingMinutesExecutionAttendeeDto>() 
                : JsonSerializer.Deserialize<List<MeetingMinutesExecutionAttendeeDto>>(dto.AttendeesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            meeting.SiteId = dto.SiteId;
            meeting.MeetingTitle = dto.MeetingTitle;
            meeting.MeetingDate = dto.MeetingDate;
            meeting.TimeFrom = dto.TimeFrom;
            meeting.TimeTo = dto.TimeTo;
            meeting.Location = dto.Location;
            meeting.Organizer = dto.Organizer;
            meeting.MeetingType = dto.MeetingType;
            meeting.Agenda = dto.Agenda;
            meeting.DiscussionPoints = dto.DiscussionPoints;
            meeting.DecisionsMade = dto.DecisionsMade;
            meeting.ActionItems = dto.ActionItems;
            meeting.ClosingNotes = dto.ClosingNotes;

            // Update attendees (simplistic replace)
            _context.Set<MeetingMinutesExecutionAttendee>().RemoveRange(meeting.Attendees);
            meeting.Attendees = attendeesDto.Select(a => new MeetingMinutesExecutionAttendee
            {
                EmployeeIdStr = a.EmployeeIdStr,
                EmployeeName = a.EmployeeName,
                EmployeeStatus = a.EmployeeStatus
            }).ToList();

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                foreach (var file in dto.Attachments)
                {
                    if (file.Length > 0)
                    {
                        string fileExtension = Path.GetExtension(file.FileName);
                        string fileName = $"momdocs/{_currentUserService.TenantId}/{Guid.NewGuid()}{fileExtension}";
                        var url = await _blobService.UploadAsync(file, fileName);

                        meeting.Attachments.Add(new MeetingMinutesExecutionAttachment
                        {
                            FileName = file.FileName,
                            FileUrl = url
                        });
                    }
                }
            }

            _context.Set<MeetingMinutesExecution>().Update(meeting);
            await _context.SaveChangesAsync();

            return await GetMeetingByIdAsync(meeting.Id);
        }

        public async Task DeleteMeetingAsync(int id)
        {
            var meeting = await _context.Set<MeetingMinutesExecution>().FindAsync(id);
            if (meeting != null)
            {
                meeting.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        private MeetingMinutesExecutionDto MapToDto(MeetingMinutesExecution meeting)
        {
            return new MeetingMinutesExecutionDto
            {
                Id = meeting.Id,
                SiteId = meeting.SiteId,
                TenantId = meeting.TenantId,
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
                Attendees = meeting.Attendees.Select(a => new MeetingMinutesExecutionAttendeeDto
                {
                    Id = a.Id,
                    EmployeeIdStr = a.EmployeeIdStr,
                    EmployeeName = a.EmployeeName,
                    EmployeeStatus = a.EmployeeStatus
                }).ToList(),
                Attachments = meeting.Attachments.Select(a => new MeetingMinutesExecutionAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FileUrl = _blobService.GenerateSasUrl(a.FileUrl, 60, false)
                }).ToList()
            };
        }
    }
}
