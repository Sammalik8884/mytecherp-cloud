using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    public class TrainingDetailService : ITrainingDetailService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public TrainingDetailService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<TrainingDetailDto>> GetAllAsync()
        {
            var details = await _context.TrainingDetails
                .Include(x => x.Participants)
                .OrderByDescending(x => x.Date)
                .ToListAsync();

            return details.Select(MapToDto);
        }

        public async Task<TrainingDetailDto?> GetByIdAsync(int id)
        {
            var detail = await _context.TrainingDetails
                .Include(x => x.Participants)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (detail == null) return null;

            return MapToDto(detail);
        }

        public async Task<TrainingDetailDto> CreateAsync(TrainingDetailDto dto)
        {
            var entity = new TrainingDetail
            {
                TrainerName = dto.TrainerName ?? string.Empty,
                FromTime = dto.FromTime ?? string.Empty,
                ToTime = dto.ToTime ?? string.Empty,
                Date = dto.Date,
                Location = dto.Location ?? string.Empty,
                TrainingType = dto.TrainingType ?? string.Empty,
                TenantId = _currentUserService.TenantId ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (dto.Participants != null && dto.Participants.Any())
            {
                foreach (var participant in dto.Participants)
                {
                    entity.Participants.Add(new TrainingDetailParticipant
                    {
                        ParticipantName = participant.ParticipantName ?? string.Empty,
                        EmployeeId = participant.EmployeeId ?? string.Empty,
                        Department = participant.Department ?? string.Empty,
                        Designation = participant.Designation ?? string.Empty,
                        ContactDetails = participant.ContactDetails ?? string.Empty,
                        EmployeeStatus = participant.EmployeeStatus ?? string.Empty,
                        TenantId = _currentUserService.TenantId ?? 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            _context.TrainingDetails.Add(entity);
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<bool> UpdateAsync(int id, TrainingDetailDto dto)
        {
            var entity = await _context.TrainingDetails
                .Include(x => x.Participants)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null) return false;

            entity.TrainerName = dto.TrainerName ?? string.Empty;
            entity.FromTime = dto.FromTime ?? string.Empty;
            entity.ToTime = dto.ToTime ?? string.Empty;
            entity.Date = dto.Date;
            entity.Location = dto.Location ?? string.Empty;
            entity.TrainingType = dto.TrainingType ?? string.Empty;
            entity.UpdatedAt = DateTime.UtcNow;

            // Remove participants not in DTO
            var incomingIds = dto.Participants?.Select(p => p.Id).Where(i => i > 0).ToList() ?? new List<int>();
            var toRemove = entity.Participants.Where(p => !incomingIds.Contains(p.Id)).ToList();
            
            foreach (var part in toRemove)
            {
                _context.TrainingDetailParticipants.Remove(part);
            }

            // Update or Add participants
            if (dto.Participants != null)
            {
                foreach (var partDto in dto.Participants)
                {
                    if (partDto.Id > 0)
                    {
                        var existingPart = entity.Participants.FirstOrDefault(p => p.Id == partDto.Id);
                        if (existingPart != null)
                        {
                            existingPart.ParticipantName = partDto.ParticipantName ?? string.Empty;
                            existingPart.EmployeeId = partDto.EmployeeId ?? string.Empty;
                            existingPart.Department = partDto.Department ?? string.Empty;
                            existingPart.Designation = partDto.Designation ?? string.Empty;
                            existingPart.ContactDetails = partDto.ContactDetails ?? string.Empty;
                            existingPart.EmployeeStatus = partDto.EmployeeStatus ?? string.Empty;
                            existingPart.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    else
                    {
                        entity.Participants.Add(new TrainingDetailParticipant
                        {
                            ParticipantName = partDto.ParticipantName ?? string.Empty,
                            EmployeeId = partDto.EmployeeId ?? string.Empty,
                            Department = partDto.Department ?? string.Empty,
                            Designation = partDto.Designation ?? string.Empty,
                            ContactDetails = partDto.ContactDetails ?? string.Empty,
                            EmployeeStatus = partDto.EmployeeStatus ?? string.Empty,
                            TenantId = _currentUserService.TenantId ?? 0,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.TrainingDetails
                .Include(x => x.Participants)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null) return false;

            _context.TrainingDetails.Remove(entity);
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> UpdateParticipantAsync(int participantId, string name, string status)
        {
            var participant = await _context.TrainingDetailParticipants.FirstOrDefaultAsync(p => p.Id == participantId);
            if (participant == null) return false;

            participant.ParticipantName = name ?? string.Empty;
            participant.EmployeeStatus = status ?? string.Empty;
            participant.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteParticipantAsync(int participantId)
        {
            var participant = await _context.TrainingDetailParticipants.FirstOrDefaultAsync(p => p.Id == participantId);
            if (participant == null) return false;

            _context.TrainingDetailParticipants.Remove(participant);
            await _context.SaveChangesAsync();
            return true;
        }

        private static TrainingDetailDto MapToDto(TrainingDetail entity)
        {
            return new TrainingDetailDto
            {
                Id = entity.Id,
                TrainerName = entity.TrainerName,
                FromTime = entity.FromTime,
                ToTime = entity.ToTime,
                Date = entity.Date,
                Location = entity.Location,
                TrainingType = entity.TrainingType,
                Participants = entity.Participants?.Select(p => new TrainingDetailParticipantDto
                {
                    Id = p.Id,
                    TrainingDetailId = p.TrainingDetailId,
                    ParticipantName = p.ParticipantName,
                    EmployeeId = p.EmployeeId,
                    Department = p.Department,
                    Designation = p.Designation,
                    ContactDetails = p.ContactDetails,
                    EmployeeStatus = p.EmployeeStatus
                }).ToList() ?? new List<TrainingDetailParticipantDto>()
            };
        }
    }
}
