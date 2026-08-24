using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using MytechERP.Infrastructure.Persistance;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.Finance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class ArfExceptionService : IArfExceptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly INotificationService _notificationService;
        private readonly UserManager<AppUser> _userManager;

        public ArfExceptionService(ApplicationDbContext context, ICurrentUserService currentUserService, INotificationService notificationService, UserManager<AppUser> userManager)
        {
            _context = context;
            _currentUserService = currentUserService;
            _notificationService = notificationService;
            _userManager = userManager;
        }

        public async Task<ArfExceptionRequestDto> CreateAsync(CreateArfExceptionRequestDto dto)
        {
            var entity = new ArfExceptionRequest
            {
                EmployeeEmail = dto.EmployeeEmail,
                RequestedAmount = dto.RequestedAmount,
                Reason = dto.Reason,
                Status = "Pending"
            };
            _context.ArfExceptionRequests.Add(entity);
            await _context.SaveChangesAsync();

            var munawar = await _userManager.FindByEmailAsync("munawar.hasan@mytecheng.com");
            if (munawar != null)
            {
                await _notificationService.CreateNotificationAsync(munawar.Id, "New ARF Exception Request", $"{dto.EmployeeEmail} has requested an ARF bypass for amount {dto.RequestedAmount}.", "ARF_EXCEPTION", entity.Id);
            }

            return MapToDto(entity);
        }

        public async Task<ArfExceptionRequestDto> ApproveAsync(int id, ApproveArfExceptionRequestDto dto)
        {
            if (_currentUserService.Email?.ToLower() != "munawar.hasan@mytecheng.com")
            {
                throw new Exception("Only Munawar can approve ARF exceptions.");
            }

            var entity = await _context.ArfExceptionRequests.FindAsync(id);
            if (entity == null) throw new Exception("Request not found");

            if (string.IsNullOrWhiteSpace(dto.Comment))
            {
                throw new Exception("Comment is compulsory.");
            }

            entity.Status = dto.IsApproved ? "Approved" : "Rejected";
            entity.MunawarComment = dto.Comment;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var employee = await _userManager.FindByEmailAsync(entity.EmployeeEmail);
            if (employee != null)
            {
                await _notificationService.CreateNotificationAsync(employee.Id, $"ARF Exception {entity.Status}", $"Your ARF bypass request for {entity.RequestedAmount} was {entity.Status}. Comment: {dto.Comment}", "ARF_EXCEPTION", entity.Id);
            }

            return MapToDto(entity);
        }

        public async Task<IEnumerable<ArfExceptionRequestDto>> GetAllAsync()
        {
            var list = await _context.ArfExceptionRequests
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
            return list.Select(MapToDto);
        }

        public async Task<IEnumerable<ArfExceptionRequestDto>> GetMyRequestsAsync()
        {
            var email = _currentUserService.Email;
            var list = await _context.ArfExceptionRequests
                .Where(x => x.EmployeeEmail == email)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
            return list.Select(MapToDto);
        }

        private ArfExceptionRequestDto MapToDto(ArfExceptionRequest entity)
        {
            return new ArfExceptionRequestDto
            {
                Id = entity.Id,
                EmployeeEmail = entity.EmployeeEmail,
                RequestedAmount = entity.RequestedAmount,
                Reason = entity.Reason,
                Status = entity.Status,
                MunawarComment = entity.MunawarComment,
                IsUsed = entity.IsUsed,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
