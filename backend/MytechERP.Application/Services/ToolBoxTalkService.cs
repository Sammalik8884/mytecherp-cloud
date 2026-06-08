using MytechERP.Application.DTOs;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.Application.Services
{
    public class ToolBoxTalkService : IToolBoxTalkService
    {
        private readonly IToolBoxTalkRepository _repository;

        public ToolBoxTalkService(IToolBoxTalkRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ToolBoxTalkDto>> GetAllAsync()
        {
            var talks = await _repository.GetAllAsync();
            return talks.Select(t => new ToolBoxTalkDto
            {
                Id = t.Id,
                DocumentNo = t.DocumentNo,
                FormNo = t.FormNo,
                Date = t.Date,
                Time = t.Time,
                SiteId = t.SiteId,
                SiteName = t.Site?.Name ?? "",
                TbtPerformedBy = t.TbtPerformedBy,
                Subject = t.Subject,
                JobSupervisorName = t.JobSupervisorName,
                QehsName = t.QehsName,
                ProjectManagerName = t.ProjectManagerName,
                SelectedTopics = t.SelectedTopics,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                Attendees = t.Attendees.Select(a => new ToolBoxTalkAttendeeDto
                {
                    Id = a.Id,
                    ToolBoxTalkId = a.ToolBoxTalkId,
                    EmployeeName = a.EmployeeName,
                    Status = a.Status,
                    CreatedAt = a.CreatedAt
                }).ToList()
            });
        }

        public async Task<ToolBoxTalkDto?> GetByIdAsync(int id)
        {
            var t = await _repository.GetByIdAsync(id);
            if (t == null) return null;

            return new ToolBoxTalkDto
            {
                Id = t.Id,
                DocumentNo = t.DocumentNo,
                FormNo = t.FormNo,
                Date = t.Date,
                Time = t.Time,
                SiteId = t.SiteId,
                SiteName = t.Site?.Name ?? "",
                TbtPerformedBy = t.TbtPerformedBy,
                Subject = t.Subject,
                JobSupervisorName = t.JobSupervisorName,
                QehsName = t.QehsName,
                ProjectManagerName = t.ProjectManagerName,
                SelectedTopics = t.SelectedTopics,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                Attendees = t.Attendees.Select(a => new ToolBoxTalkAttendeeDto
                {
                    Id = a.Id,
                    ToolBoxTalkId = a.ToolBoxTalkId,
                    EmployeeName = a.EmployeeName,
                    Status = a.Status,
                    CreatedAt = a.CreatedAt
                }).ToList()
            };
        }

        public async Task<ToolBoxTalkDto> CreateAsync(ToolBoxTalkDto dto)
        {
            var entity = new ToolBoxTalk
            {
                DocumentNo = dto.DocumentNo,
                FormNo = dto.FormNo,
                Date = dto.Date,
                Time = dto.Time,
                SiteId = dto.SiteId,
                TbtPerformedBy = dto.TbtPerformedBy,
                Subject = dto.Subject,
                JobSupervisorName = dto.JobSupervisorName,
                QehsName = dto.QehsName,
                ProjectManagerName = dto.ProjectManagerName,
                SelectedTopics = dto.SelectedTopics,
                Attendees = dto.Attendees.Select(a => new ToolBoxTalkAttendee
                {
                    EmployeeName = a.EmployeeName,
                    Status = a.Status
                }).ToList()
            };

            await _repository.AddAsync(entity);
            dto.Id = entity.Id;
            return dto;
        }

        public async Task UpdateAsync(int id, ToolBoxTalkDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return;

            entity.DocumentNo = dto.DocumentNo;
            entity.FormNo = dto.FormNo;
            entity.Date = dto.Date;
            entity.Time = dto.Time;
            entity.SiteId = dto.SiteId;
            entity.TbtPerformedBy = dto.TbtPerformedBy;
            entity.Subject = dto.Subject;
            entity.JobSupervisorName = dto.JobSupervisorName;
            entity.QehsName = dto.QehsName;
            entity.ProjectManagerName = dto.ProjectManagerName;
            entity.SelectedTopics = dto.SelectedTopics;

            // Handle Attendees updates
            var existingAttendeeIds = dto.Attendees.Where(a => a.Id != 0).Select(a => a.Id).ToList();
            var attendeesToRemove = entity.Attendees.Where(a => !existingAttendeeIds.Contains(a.Id)).ToList();

            foreach (var attendee in attendeesToRemove)
            {
                entity.Attendees.Remove(attendee);
            }

            foreach (var attendeeDto in dto.Attendees)
            {
                if (attendeeDto.Id == 0)
                {
                    entity.Attendees.Add(new ToolBoxTalkAttendee
                    {
                        EmployeeName = attendeeDto.EmployeeName,
                        Status = attendeeDto.Status
                    });
                }
                else
                {
                    var existing = entity.Attendees.FirstOrDefault(a => a.Id == attendeeDto.Id);
                    if (existing != null)
                    {
                        existing.EmployeeName = attendeeDto.EmployeeName;
                        existing.Status = attendeeDto.Status;
                    }
                }
            }

            await _repository.UpdateAsync(entity);
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity != null)
            {
                await _repository.DeleteAsync(entity);
            }
        }

        public async Task UpdateAttendeeAsync(int attendeeId, ToolBoxTalkAttendeeDto dto)
        {
            var attendee = await _repository.GetAttendeeByIdAsync(attendeeId);
            if (attendee != null)
            {
                attendee.EmployeeName = dto.EmployeeName;
                attendee.Status = dto.Status;
                await _repository.UpdateAttendeeAsync(attendee);
            }
        }

        public async Task DeleteAttendeeAsync(int attendeeId)
        {
            var attendee = await _repository.GetAttendeeByIdAsync(attendeeId);
            if (attendee != null)
            {
                await _repository.DeleteAttendeeAsync(attendee);
            }
        }
    }
}
