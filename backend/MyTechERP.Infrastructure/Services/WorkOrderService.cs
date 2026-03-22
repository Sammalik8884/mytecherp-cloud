using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain;
using MytechERP.domain.Entities;
using MytechERP.domain.Enums;
using MytechERP.domain.Interfaces;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace MyTechERP.Infrastructure.Services
{
    public class WorkOrderService : IWorkOrderService
    {
        private readonly IWorkOrderRepository _repository;
        private readonly IContractRepository _contractRepository;
        private IChecklistRepository _checklistRepository;
        private readonly ApplicationDbContext _context;
        private readonly IWorkflowService _workflowService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IBlobService _blobService;
        private readonly UserManager<AppUser> _userManager;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;

        public WorkOrderService(
            ICurrentUserService currentUserService,
            IWorkflowService workflowService,
            IWorkOrderRepository repository,
            IContractRepository contractRepository,
            IChecklistRepository checklistRepository,
            IBlobService blobService,
            ApplicationDbContext context,
            UserManager<AppUser> userManager,
            INotificationService notificationService,
            IEmailService emailService)
        {
            _repository = repository;
            _contractRepository = contractRepository;
            _checklistRepository = checklistRepository;
            _context = context;
            _workflowService = workflowService;
            _currentUserService = currentUserService;
            _blobService = blobService;
            _userManager = userManager;
            _notificationService = notificationService;
            _emailService = emailService;
        }

        public async Task<WorkOrderDto> CreateWorkOrderAsync(CreateWorkOrderDto request)
        {
            var userTenantId = _currentUserService.TenantId;
            if (userTenantId == null)
                throw new UnauthorizedAccessException("Security Error: No Tenant ID found in user token.");

            if (request.ContractId > 0)
            {
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    throw new KeyNotFoundException($"Contract with ID {request.ContractId} not found.");
                }
                if (contract.TenantId != userTenantId)
                {
                    throw new UnauthorizedAccessException("Access Denied: You cannot create Work Orders for a different Tenant's contract.");
                }
            }

            var workOrder = new WorkOrder
            {
                Description = request.Description,
                ContractId = request.ContractId > 0 ? request.ContractId : null,
                ScheduledDate = request.ScheduledDate,
                TechnicianId = request.TechnicianId,
                Status = WorkOrderStatus.Created,
                TenantId = userTenantId.Value,
                AssetId = request.AssetId > 0 ? request.AssetId : null

            };

            var createdEntity = await _repository.AddAsync(workOrder);
            var fullEntity = await _repository.GetByIdAsync(createdEntity.Id);
            return MapToDto(fullEntity!);
        }

        public async Task<WorkOrderDto?> GetWorkOrderByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;
            return MapToDto(entity);
        }

        public async Task<List<WorkOrderDto>> GetAllWorkOrdersAsync(MytechERP.Application.Filters.PaginationFilter filter)
        {
            var entities = await _repository.GetAllAsync(new MytechERP.domain.Common.PaginationParams(filter.PageNumber, filter.PageSize));
            return entities.Select(MapToDto).ToList();
        }

        public async Task<List<WorkOrderDto>> GetMyJobsAsync(string technicianId)
        {
            var entities = await _repository.GetByTechnicianAsync(technicianId);
            return entities.Select(MapToDto).ToList();
        }

        public async Task<bool> UpdateWorkOrderAsync(int id, UpdateWorkOrderDto request)
        {
            if (id != request.Id) return false;

            var workOrder = await _repository.GetByIdAsync(id);
            if (workOrder == null) return false;

            if (!string.IsNullOrEmpty(request.Description)) workOrder.Description = request.Description;
            if (request.ScheduledDate.HasValue) workOrder.ScheduledDate = request.ScheduledDate.Value;
            if (!string.IsNullOrEmpty(request.TechnicianId)) workOrder.TechnicianId = request.TechnicianId;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<WorkOrderStatus>(request.Status, true, out var parsedStatus))
                workOrder.Status = parsedStatus;
            if (!string.IsNullOrEmpty(request.TechnicianNotes)) workOrder.TechnicianNotes = request.TechnicianNotes;
            if (request.AssetId.HasValue && request.AssetId.Value > 0) workOrder.AssetId = request.AssetId.Value;

            await _repository.UpdateAsync(workOrder);
            return true;
        }

        public async Task<bool> DeleteWorkOrderAsync(int id)
        {
            var exists = await _repository.GetByIdAsync(id);
            if (exists == null) return false;
            await _repository.DeleteAsync(id);
            return true;
        }

        private static WorkOrderDto MapToDto(WorkOrder w)
        {
            return new WorkOrderDto
            {
                Id = w.Id,
                Description = w.Description,
                Status = w.Status.ToString(),
                Result = w.Result.ToString(), 
                ScheduledDate = w.ScheduledDate,
                CompletedDate = w.CompletedDate,
                ContractId = w.ContractId ?? 0,
                CustomerName = w.Contract?.Customer?.CompanyName
                               ?? w.ReferenceQuotation?.Customer?.Name
                               ?? "Unknown",
                SiteName = w.Contract?.Customer?.SiteName
                           ?? w.Asset?.Site?.Name
                           ?? "Unknown",
                TechnicianId = w.TechnicianId,
                TechnicianName = w.Technician?.UserName,
                TechnicianNotes = w.TechnicianNotes,
                CheckInTime = w.TimeLogs?.OrderByDescending(t => t.CheckInTime).FirstOrDefault()?.CheckInTime,
                CheckOutTime = w.TimeLogs?.OrderByDescending(t => t.CheckInTime).FirstOrDefault()?.CheckOutTime
            };
        }

        public async Task<WorkOrderDto> InitializeInspectionAsync(int workOrderId)
        {
            var userTenantId = _currentUserService.TenantId.Value;
            var workorder = await _context.WorkOrders
                .Include(w => w.Asset)
                    .ThenInclude(a => a.Site)
                .Include(w => w.Contract)
                    .ThenInclude(c => c.Customer)
                .FirstOrDefaultAsync(w => w.Id == workOrderId);

            if (workorder == null) { throw new KeyNotFoundException("Work Order Not found"); }

            if (userTenantId != null && workorder.TenantId != userTenantId)
            {
                throw new UnauthorizedAccessException("Access Denied: This Work Order belongs to another Tenant.");
            }

            if (workorder.Asset == null)
            {
               
                throw new Exception("This Work Order is not linked to an Asset, so inspection cannot be initialized.");
            }

            bool alreadyinitialzed = await _context.WorkOrderChecklistResults.AnyAsync(r => r.WorkOrderId == workOrderId);
            if (alreadyinitialzed) return MapToDto(workorder);

            var templateQuestions = await _checklistRepository.GetByCategoryIdAsync(workorder.Asset.CategoryId);

            if (!templateQuestions.Any())
                throw new Exception($"No checklist questions found for Category: {workorder.Asset.CategoryId}");

            var newResults = templateQuestions.Select(q => new WorkOrderChecklistResult
            {
                WorkOrderId = workOrderId,
                ChecklistQuestionId = q.Id,
                SnapshotText = q.Text,
                SnapshotJson = q.ConfigJson,
                QuestionText = q.Text,
                Value = string.Empty,
                IsPass = true,
                TenantId = workorder.TenantId
            }).ToList();

            _context.WorkOrderChecklistResults.AddRange(newResults);

            _workflowService.ValidateTransition(workorder.Status, WorkOrderStatus.Initialized);
            workorder.Status = WorkOrderStatus.Initialized;

            await _context.SaveChangesAsync();
            return MapToDto(workorder);
        }

        public async Task<List<ChecklistResultDto>> GetChecklistAsync(int workOrderId)
        {
            var results = await _context.WorkOrderChecklistResults
                .Where(w => w.WorkOrderId == workOrderId)
                .ToListAsync();

            var dtos = new List<ChecklistResultDto>();

            foreach (var row in results)
            {
                QuestionConfig config = null;
                if (!string.IsNullOrEmpty(row.SnapshotJson))
                {
                    try
                    {
                        config = JsonSerializer.Deserialize<QuestionConfig>(row.SnapshotJson);
                    }
                    catch
                    {
                        config = new QuestionConfig();
                    }
                }

                dtos.Add(new ChecklistResultDto
                {
                    Id = row.Id,
                    QuestionText = row.QuestionText,
                    InputType = config?.Type ?? "Text",
                    Options = config?.Options ?? new List<string>(),
                    SelectedValue = row.Value,
                    IsPass = row.IsPass
                });
            }

            return dtos;
        }

        public async Task<bool> SubmitChecklistAsync(int workOrderId, List<UpdateChecklistDto> answers)
        {
            var dbResults = await _context.WorkOrderChecklistResults
                .Where(w => w.WorkOrderId == workOrderId)
                .ToListAsync();

            foreach (var answer in answers)
            {
                var row = dbResults.FirstOrDefault(r => r.Id == answer.ResultId);
                if (row != null)
                {
                    row.Value = answer.SelectedValue;
                    row.Comment = answer.Comments;

                    if (row.Value == "No" || row.Value == "Fail")
                    {
                        row.IsPass = false;
                    }
                    else
                    {
                        row.IsPass = true;
                    }
                }
            }
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CompleteJobAsync(int id, string notes, InspectionResult result)
        {
            var technicianId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(technicianId)) throw new UnauthorizedAccessException("User not authenticated.");
            var workOrder = await _context.WorkOrders.FindAsync(id);
            if (workOrder == null) return false;

            _workflowService.ValidateTransition(workOrder.Status, WorkOrderStatus.PendingApproval);

            var evidenceCount = await _context.JobEvidences.CountAsync(e => e.WorkOrderId == id);
            if (evidenceCount == 0)
                throw new InvalidOperationException("Compliance Block: You must upload at least one evidence photo.");

            workOrder.Status = WorkOrderStatus.PendingApproval;
            workOrder.TechnicianNotes = notes;
            workOrder.Result = result; 

            var log = new AuditLog
            {
                EntityName = "WorkOrder",
                EntityId = id,
                Action = "SubmittedForReview",
                UserId = technicianId,
                Details = $"Technician finished. Result: {result}. Evidence: {evidenceCount}",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(log);

            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> ApproveJobAsync(int id, bool isApproved)
        {
            var managerId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(managerId)) throw new UnauthorizedAccessException("User not authenticated.");
            var workOrder = await _context.WorkOrders.FindAsync(id);
            if (workOrder == null) return false;

            var targetStatus = isApproved ? WorkOrderStatus.Approved : WorkOrderStatus.Rejected;
            _workflowService.ValidateTransition(workOrder.Status, targetStatus);

            workOrder.Status = targetStatus;

            if (isApproved)
            {
                workOrder.CompletedDate = DateTime.UtcNow;
            }

            var log = new AuditLog
            {
                EntityName = "WorkOrder",
                EntityId = id,
                Action = isApproved ? "Approved" : "Rejected",
                UserId = managerId,
                Details = isApproved ? "Manager signed off." : "Manager requested revisions.",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(log);

            await _context.SaveChangesAsync();
            return true;
        }

        public class QuestionConfig
        {
            public string Type { get; set; } = "Text";
            public List<string> Options { get; set; } = new List<string>();
            public string Standard { get; set; } = string.Empty;
        }
        public async Task<int> CreateWorkOrderFromQuoteAsync(CreateRepairJobDto dto)
        {
            var quote = await _context.Quotations
                .Include(q => q.Items)
                .Include(q => q.Customer)
                .FirstOrDefaultAsync(q => q.Id == dto.QuoteId);

            if (quote == null) throw new Exception("Quote not found");
            if (quote.Status != QuotationStatus.Approved) throw new Exception("Quote must be Approved first!");

            var workOrder = new WorkOrder
            {
                JobNumber = $"JOB-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                CustomerId = quote.CustomerId,
                JobType = JobType.Repair,
                Status = WorkOrderStatus.Created,
                ScheduledDate = dto.ScheduledDate,
                Description = $"Repair Job based on Quote #{quote.QuoteNumber}",
                TenantId = quote.TenantId
            };

            foreach (var qItem in quote.Items)
            {
                
                workOrder.Description += $"\n[Requires Part]: {qItem.Description} (Qty: {qItem.Quantity})";

              
            }

            quote.Status = QuotationStatus.Converted;

            _context.WorkOrders.Add(workOrder);
            await _context.SaveChangesAsync();

            return workOrder.Id;
        }
        public async Task<object> AddEvidenceAsync(int workOrderId, System.IO.Stream fileStream, string fileName, string contentType, double? latitude, double? longitude)
        {
            var technicianId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(technicianId)) throw new UnauthorizedAccessException("User not authenticated.");

            string contentHash;
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var hashBytes = sha256.ComputeHash(fileStream);
                contentHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
                fileStream.Position = 0; 
            }

            var uniqueFileName = $"WO-{workOrderId}-{Guid.NewGuid()}{System.IO.Path.GetExtension(fileName)}";
            
           
            
            var fileUrl = await _blobService.UploadStreamAsync(fileStream, uniqueFileName, contentType); 

            var evidence = new MytechERP.domain.Entities.Job.JobEvidence
            {
                WorkOrderId = workOrderId,
                FileName = uniqueFileName,
                FileUrl = fileUrl,
                FileType = contentType,
                ContentHash = contentHash,
                TechnicianId = technicianId,
                GpsLatitude = latitude ?? 0,
                GpsLongitude = longitude ?? 0,
                Timestamp = DateTime.UtcNow
            };

            _context.JobEvidences.Add(evidence);
            await _context.SaveChangesAsync();
            
            return new { Message = "Evidence secured.", Url = fileUrl, Hash = contentHash };
        }

        public async Task<bool> AssignTechnicianAsync(int workOrderId, AssignTechnicianDto dto)
        {
            var userTenantId = _currentUserService.TenantId;
            if (userTenantId == null)
                throw new UnauthorizedAccessException("Security Error: No Tenant ID found in user token.");

            var workOrder = await _context.WorkOrders.FirstOrDefaultAsync(w => w.Id == workOrderId);
            if (workOrder == null)
            {
                throw new KeyNotFoundException($"WorkOrder with ID {workOrderId} not found.");
            }

            if (workOrder.TenantId != userTenantId)
            {
                throw new UnauthorizedAccessException("Access Denied: Work Order belongs to another Tenant.");
            }

            var technician = await _userManager.FindByIdAsync(dto.TechnicianId);
            if (technician == null)
            {
                throw new KeyNotFoundException($"Technician with ID {dto.TechnicianId} not found.");
            }

            if (technician.TenantId != userTenantId)
            {
                throw new UnauthorizedAccessException("Access Denied: Technician belongs to another Tenant.");
            }

            var isTechnicianRole = await _userManager.IsInRoleAsync(technician, "Technician");
            if (!isTechnicianRole)
            {
                throw new InvalidOperationException("Validation Error: User does not have the 'Tech' role.");
            }

            workOrder.TechnicianId = technician.Id;
            _workflowService.ValidateTransition(workOrder.Status, WorkOrderStatus.Assigned);
            workOrder.Status = WorkOrderStatus.Assigned;
            
            var log = new AuditLog
            {
                EntityName = "WorkOrder",
                EntityId = workOrderId,
                Action = "Technician Assigned",
                UserId = _currentUserService.UserId,
                Details = $"Assigned Technician {technician.FullName} to Work Order.",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(log);

            await _context.SaveChangesAsync();

            // Notify the Technician
            var assignerId = _currentUserService.UserId;
            var assignerName = "An Admin/Manager";
            if (!string.IsNullOrEmpty(assignerId))
            {
                var assigner = await _userManager.FindByIdAsync(assignerId);
                if (assigner != null) assignerName = assigner.FullName;
            }

            var notificationTitle = "New Job Assigned";
            var notificationMsg = $"{assignerName} assigned you to Job #{workOrder.JobNumber}.";

            // Dashboard App Notification
            await _notificationService.CreateNotificationAsync(
                userId: technician.Id,
                title: notificationTitle,
                message: notificationMsg,
                type: "WorkOrder",
                targetId: workOrder.Id
            );

            // Email Notification
            if (!string.IsNullOrEmpty(technician.Email))
            {
                try
                {
                    await _emailService.SendEmailAsync(
                        technician.Email,
                        notificationTitle,
                        $"<p>Hello {technician.FullName},</p><p>{notificationMsg}</p><p>Please log in to the system and check your scheduled jobs for details.</p>"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send assignment email to {technician.Email}: {ex.Message}");
                }
            }

            return true;
        }
    }
}