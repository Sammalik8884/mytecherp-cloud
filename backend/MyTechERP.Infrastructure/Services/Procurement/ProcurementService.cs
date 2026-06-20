using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Procurement;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.Finance;
using MytechERP.domain.Entities.Procurement;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.Infrastructure.Services.Procurement
{
    public class ProcurementService : IProcurementService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public ProcurementService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        private ProcurementRequestDto MapToDto(ProcurementRequest entity)
        {
            return new ProcurementRequestDto
            {
                Id = entity.Id,
                ProcurementNumber = entity.ProcurementNumber,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                SupervisorName = entity.SupervisorName,
                SupervisorEmail = entity.SupervisorEmail,
                SiteId = entity.SiteId,
                Status = entity.Status,
                PdEmail = entity.PdEmail,
                PdRemarks = entity.PdRemarks,
                PdApprovalDate = entity.PdApprovalDate,
                ProcurementHeadEmail = entity.ProcurementHeadEmail,
                AmountRequestFormId = entity.AmountRequestFormId,
                AssignedExecutiveEmail = entity.AssignedExecutiveEmail,
                AssignedDate = entity.AssignedDate,
                CompletedDate = entity.CompletedDate,
                DeliveryNoteText = entity.DeliveryNoteText,
                DeliveryNoteDocuments = entity.DeliveryNoteDocuments,
                Items = entity.Items.Select(i => new ProcurementRequestItemDto
                {
                    Id = i.Id,
                    ProcurementRequestId = i.ProcurementRequestId,
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    Reason = i.Reason
                }).ToList()
            };
        }

        public async Task<List<ProcurementRequestDto>> GetAllProcurementsAsync(string userId, string role)
        {
            var query = _context.ProcurementRequests.Include(p => p.Items).AsQueryable();

            if (role == "SiteSupervisor")
            {
                query = query.Where(p => p.SupervisorEmail == userId);
            }
            // Add other role-based filters if necessary

            var requests = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return requests.Select(MapToDto).ToList();
        }

        public async Task<List<ProcurementRequestDto>> GetPendingPdApprovalsAsync()
        {
            var requests = await _context.ProcurementRequests
                .Include(p => p.Items)
                .Where(p => p.Status == "PendingPDApproval")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return requests.Select(MapToDto).ToList();
        }

        public async Task<List<ProcurementRequestDto>> GetApprovedRequestsAsync()
        {
            var requests = await _context.ProcurementRequests
                .Include(p => p.Items)
                .Where(p => p.Status == "ApprovedByPD" || p.Status == "ARFCreated" || p.Status == "ARFApproved")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return requests.Select(MapToDto).ToList();
        }

        public async Task<List<ProcurementRequestDto>> GetPendingProcurementsForExecutiveAsync(string executiveEmail)
        {
            var requests = await _context.ProcurementRequests
                .Include(p => p.Items)
                .Where(p => p.AssignedExecutiveEmail == executiveEmail && p.Status == "AssignedToExecutive")
                .OrderByDescending(p => p.AssignedDate)
                .ToListAsync();

            return requests.Select(MapToDto).ToList();
        }

        public async Task<ProcurementRequestDto> GetByIdAsync(int id)
        {
            var request = await _context.ProcurementRequests
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (request == null) throw new Exception("Procurement request not found");

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> CreateRequestAsync(CreateProcurementRequestDto dto, string supervisorName, string supervisorEmail)
        {
            var today = DateTime.UtcNow;
            var count = await _context.ProcurementRequests.CountAsync(p => p.CreatedAt.Year == today.Year && p.CreatedAt.Month == today.Month);
            var procNum = $"PR-{today:yyyyMM}-{count + 1:D4}";

            var request = new ProcurementRequest
            {
                ProcurementNumber = procNum,
                SupervisorName = supervisorName,
                SupervisorEmail = supervisorEmail,
                SiteId = dto.SiteId,
                Status = "PendingPDApproval",
                Items = dto.Items.Select(i => new ProcurementRequestItem
                {
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    Reason = i.Reason
                }).ToList()
            };

            _context.ProcurementRequests.Add(request);
            await _context.SaveChangesAsync();

            // Notify PD
            await _notificationService.CreateNotificationAsync(
                "ProjectDirector", // Assume role-based notification or fetch PD users
                "New Procurement Request",
                $"A new procurement request ({procNum}) has been submitted by {supervisorName} and is awaiting your approval.",
                $"/procurement/pending-approvals"
            );

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> ReviewByPdAsync(int id, PdReviewProcurementDto dto, string pdEmail)
        {
            var request = await _context.ProcurementRequests.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            request.PdEmail = pdEmail;
            request.PdRemarks = dto.Remarks;
            request.PdApprovalDate = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;

            if (dto.IsApproved)
            {
                request.Status = "ApprovedByPD";
                
                await _notificationService.CreateNotificationAsync(
                    "ProcurementHead", // Target role
                    "Procurement Request Approved",
                    $"Procurement request {request.ProcurementNumber} has been approved by PD and is ready for ARF generation.",
                    $"/procurement/approved"
                );
            }
            else
            {
                request.Status = "RejectedByPD";
                
                await _notificationService.CreateNotificationAsync(
                    request.SupervisorEmail, // Target user
                    "Procurement Request Rejected",
                    $"Your procurement request {request.ProcurementNumber} was rejected by the Project Director. Remarks: {dto.Remarks}",
                    $"/procurement/dashboard"
                );
            }

            await _context.SaveChangesAsync();
            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> GenerateArfAsync(int procurementId, string procurementHeadEmail, string arfDetailsUrl)
        {
            var request = await _context.ProcurementRequests.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == procurementId);
            if (request == null) throw new Exception("Procurement request not found");
            
            // Logic to create ARF... (simplified mapping)
            var arf = new AmountRequestForm
            {
                EmployeeName = "Procurement Head", // Using ProcHead or System
                EmployeeEmail = procurementHeadEmail,
                PurposeOfAdvance = $"Procurement for Request {request.ProcurementNumber}",
                SiteId = request.SiteId,
                Status = "PendingDirector", // Initial ARF status
                ArfNumber = $"ARF-{DateTime.UtcNow:yyyyMMddHHmmss}"
            };

            _context.AmountRequestForms.Add(arf);
            await _context.SaveChangesAsync();

            request.AmountRequestFormId = arf.Id;
            request.Status = "ARFCreated";
            request.UpdatedAt = DateTime.UtcNow;
            request.ProcurementHeadEmail = procurementHeadEmail;
            
            await _context.SaveChangesAsync();
            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> AssignExecutiveAsync(int id, AssignProcurementExecutiveDto dto)
        {
            var request = await _context.ProcurementRequests.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            // We could check if ARF is Released, but let's assume UI handles the condition
            request.AssignedExecutiveEmail = dto.ExecutiveEmail;
            request.AssignedDate = DateTime.UtcNow;
            request.Status = "AssignedToExecutive";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _notificationService.CreateNotificationAsync(
                request.AssignedExecutiveEmail,
                "New Procurement Assigned",
                $"You have been assigned procurement {request.ProcurementNumber}.",
                $"/procurement/pending-procurements"
            );
            
            // Also notify supervisor and proc head
            await _notificationService.CreateNotificationAsync(
                request.SupervisorEmail,
                "Procurement Assigned",
                $"Your procurement {request.ProcurementNumber} has been assigned to {dto.ExecutiveEmail}.",
                $"/procurement/dashboard"
            );

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> CompleteProcurementAsync(int id, CompleteProcurementDto dto)
        {
            var request = await _context.ProcurementRequests.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            if (string.IsNullOrWhiteSpace(dto.DeliveryNoteText) && (dto.DeliveryNoteDocuments == null || dto.DeliveryNoteDocuments.Count == 0))
            {
                throw new Exception("At least one delivery note (text or document) is required.");
            }

            request.DeliveryNoteText = dto.DeliveryNoteText;
            request.DeliveryNoteDocuments = dto.DeliveryNoteDocuments ?? new List<string>();
            request.CompletedDate = DateTime.UtcNow;
            request.Status = "Completed";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _notificationService.CreateNotificationAsync(
                request.SupervisorEmail,
                "Procurement Completed",
                $"Procurement {request.ProcurementNumber} has been completed and delivery notes attached.",
                $"/procurement/dashboard"
            );

            if (!string.IsNullOrEmpty(request.ProcurementHeadEmail))
            {
                await _notificationService.CreateNotificationAsync(
                    request.ProcurementHeadEmail,
                    "Procurement Completed",
                    $"Procurement {request.ProcurementNumber} has been completed by {request.AssignedExecutiveEmail}.",
                    $"/procurement/dashboard"
                );
            }

            return MapToDto(request);
        }
    }
}
