using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.Finance;
using MyTechERP.Infrastructure.Persistence; // Assuming this is correct from ApplicationDbContext location
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    public class AmountRequestFormService : IAmountRequestFormService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly IBlobService _blobService;
        private readonly UserManager<AppUser> _userManager;

        public AmountRequestFormService(
            ApplicationDbContext context, 
            ICurrentUserService currentUserService, 
            IEmailService emailService,
            INotificationService notificationService,
            IBlobService blobService,
            UserManager<AppUser> userManager)
        {
            _context = context;
            _currentUserService = currentUserService;
            _emailService = emailService;
            _notificationService = notificationService;
            _blobService = blobService;
            _userManager = userManager;
        }

        // Helper: send in-app bell notification to Auditors (Faisal Ghani, Asma)
        private async Task NotifyAuditorsAsync(string title, string message, int arfId)
        {
            try
            {
                var emails = new[] { "faisal.ghani@mytecheng.com", "abdul.majeed@mytecheng.com", "asma@mytecheng.com" };
                foreach (var email in emails)
                {
                    var auditor = await _userManager.FindByEmailAsync(email);
                    if (auditor != null)
                    {
                        await _notificationService.CreateNotificationAsync(
                            userId: auditor.Id,
                            title: title,
                            message: message,
                            type: "ARF",
                            targetId: arfId
                        );
                    }
                }
            }
            catch (Exception) { }
        }

        // Helper: send in-app bell notification to all Admins + a specific email user
        private async Task NotifyAdminsAndUserAsync(string email, string title, string message, int arfId)
        {
            try
            {
                var admins = await _userManager.GetUsersInRoleAsync("Admin");
                var recipients = admins.ToList();

                // Also notify the specific email user (e.g., Director shahbaz.ali)
                if (!string.IsNullOrEmpty(email))
                {
                    var specificUser = await _userManager.FindByEmailAsync(email);
                    if (specificUser != null && !recipients.Any(u => u.Id == specificUser.Id))
                        recipients.Add(specificUser);
                }

                foreach (var user in recipients)
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: user.Id,
                        title: title,
                        message: message,
                        type: "ARF",
                        targetId: arfId
                    );
                }
            }
            catch (Exception) { }
        }

        private AmountRequestFormDto MapToDto(AmountRequestForm entity)
        {
            return new AmountRequestFormDto
            {
                Id = entity.Id,
                CreatedAt = entity.CreatedAt,
                ArfNumber = entity.ArfNumber,
                EmployeeName = entity.EmployeeName,
                EmployeeEmail = entity.EmployeeEmail,
                AdvanceRequested = entity.AdvanceRequested,
                AccountDetail = entity.AccountDetail,
                DateOfFundRequired = entity.DateOfFundRequired,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name,
                OfficeId = entity.OfficeId,
                OfficeName = entity.Office?.Name,
                CustomSiteName = entity.CustomSiteName,
                ClientName = entity.ClientName,
                PurposeOfAdvance = entity.PurposeOfAdvance,
                Status = entity.Status,
                DirectorName = entity.DirectorName,
                DirectorApprovalDate = entity.DirectorApprovalDate,
                DirectorComment = entity.DirectorComment,
                CeoName = entity.CeoName,
                CeoApprovalDate = entity.CeoApprovalDate,
                CeoComment = entity.CeoComment,
                AccountsDateOfEntry = entity.AccountsDateOfEntry,
                AccountsDateOfFundReleased = entity.AccountsDateOfFundReleased,
                AccountsReleasedAmount = entity.AccountsReleasedAmount,
                AccountsRemarks = entity.AccountsRemarks,
                Attachments = entity.Attachments.Select(url => _blobService.GenerateSasUrl(url, 1440)).ToList(),
                Payments = entity.Payments?.Select(p => new AmountRequestPaymentDto
                {
                    Id = p.Id,
                    ReleasedDate = p.ReleasedDate,
                    ReleasedAmount = p.ReleasedAmount,
                    ReceivedBy = p.ReceivedBy,
                    ModeOfPayment = p.ModeOfPayment,
                    Remarks = p.Remarks,
                    PaymentSlipUrl = !string.IsNullOrEmpty(p.PaymentSlipUrl) ? _blobService.GenerateSasUrl(p.PaymentSlipUrl, 1440, false) : null
                }).ToList() ?? new List<AmountRequestPaymentDto>()
            };
        }

        public async Task<AmountRequestFormDto> GetByIdAsync(int id)
        {
            var entity = await _context.AmountRequestForms
                .Include(a => a.Site)
                .Include(a => a.Payments)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (entity == null) throw new Exception("Amount Request Form not found");

            return MapToDto(entity);
        }

        public async Task<List<AmountRequestFormDto>> GetAllAsync()
        {
            var role = _currentUserService.Role;
            var email = _currentUserService.Email?.ToLower();

            var query = _context.AmountRequestForms
                .Include(a => a.Site)
                .Include(a => a.Office)
                .Include(a => a.Payments)
                .AsQueryable();

            if (role != "Admin" && role != "Manager" && role != "Accounts Head" && role != "CEO" && role != "Accounts Assistant" && 
                email != "shahbaz.ali@mytecheng.com" && email != "munawar.hasan@mytecheng.com" && email != "asma@mytecheng.com" && email != "faisal.ghani@mytecheng.com" && email != "abdul.majeed@mytecheng.com")
            {
                query = query.Where(a => a.EmployeeEmail.ToLower() == email);
            }

            var entities = await query
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<List<AmountRequestFormDto>> GetPendingForAccountsAsync()
        {
            var query = _context.AmountRequestForms
                .Include(a => a.Site)
                .Include(a => a.Office)
                .Include(a => a.Payments)
                .Where(a => a.Status.Contains("Approved"))
                .AsQueryable();

            var entities = await query
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<List<AmountRequestFormDto>> GetHistoryForAccountsAsync()
        {
            var query = _context.AmountRequestForms
                .Include(a => a.Site)
                .Include(a => a.Office)
                .Include(a => a.Payments)
                .Where(a => a.Status.Contains("Released"))
                .AsQueryable();

            var entities = await query
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<List<AmountRequestFormDto>> GetPartialForAccountsAsync()
        {
            var query = _context.AmountRequestForms
                .Include(a => a.Site)
                .Include(a => a.Office)
                .Include(a => a.Payments)
                .Where(a => a.Status == "Partially Paid")
                .AsQueryable();

            var entities = await query
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<AmountRequestFormDto> CreateAsync(CreateAmountRequestFormDto dto)
        {
            var requestEmail = dto.EmployeeEmail ?? "";
            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == requestEmail);
            var targetDesignation = targetUser?.Designation?.ToLower() ?? "";
            
            bool isSiteSupervisor = targetDesignation.Contains("site supervisor") || targetDesignation.Contains("supervisor");
            bool isProjectDirector = targetDesignation.Contains("project director") || targetDesignation.Contains("director");
            bool isEngineer = targetDesignation.Contains("engineer");

            if (requestEmail.Equals(_currentUserService.Email, StringComparison.OrdinalIgnoreCase))
            {
                var roles = _currentUserService.Roles;
                if (roles.Contains("Project Director")) isProjectDirector = true;
                if (roles.Contains("Site Supervisor")) isSiteSupervisor = true;
                if (roles.Contains("Engineer")) isEngineer = true;
            }

            decimal limit = 100000m; 
            if (targetUser?.CustomArfLimit.HasValue == true)
            {
                limit = targetUser.CustomArfLimit.Value;
            }
            else
            {
                if (isProjectDirector) {
                    limit = 500000m;
                } else if (isSiteSupervisor || isEngineer) {
                    limit = 300000m;
                }
            }

            // Check if there is an approved exception request
            var exceptionRequest = await _context.ArfExceptionRequests
                .Where(r => r.EmployeeEmail == requestEmail && r.Status == "Approved" && !r.IsUsed)
                .OrderBy(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            bool bypassLimits = false;
            if (exceptionRequest != null && dto.AdvanceRequested <= exceptionRequest.RequestedAmount)
            {
                bypassLimits = true;
            }

            if (!bypassLimits)
            {
                var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);
                var oldArfs = await _context.AmountRequestForms
                    .Where(a => a.EmployeeEmail == requestEmail && !a.IsDeleted && 
                                a.Status != "Rejected by Director" && a.Status != "Rejected by CEO" && 
                                a.CreatedAt < oneMonthAgo)
                    .ToListAsync();

                foreach (var oldArf in oldArfs)
                {
                    var hasExpenses = await _context.Expenses
                        .AnyAsync(e => e.AmountRequestFormId == oldArf.Id && !e.IsDeleted && e.Status != "Rejected");
                    if (!hasExpenses)
                    {
                        throw new Exception($"Cannot create new ARF. You have a previous ARF ({oldArf.ArfNumber}) older than one month without any submitted expenses. Please upload the previous expenses to generate a new ARF.");
                    }
                }

                var activeArfs = await _context.AmountRequestForms
                    .Where(a => a.EmployeeEmail == requestEmail && !a.IsDeleted && 
                                a.Status != "Rejected by Director" && a.Status != "Rejected by CEO")
                    .ToListAsync();

                decimal consumedLimit = 0;
                foreach (var arf in activeArfs)
                {
                    var acceptedExpenseItems = await _context.Expenses
                        .Where(e => e.AmountRequestFormId == arf.Id && !e.IsDeleted && e.Status == "Accepted")
                        .SelectMany(e => e.Items)
                        .ToListAsync();

                    decimal acceptedAmount = acceptedExpenseItems.Sum(i => i.Amount);
                    decimal unsettled = arf.AdvanceRequested - acceptedAmount;
                    if (unsettled > 0)
                    {
                        consumedLimit += unsettled;
                    }
                }

                decimal availableLimit = limit - consumedLimit;
                if (dto.AdvanceRequested > availableLimit)
                {
                    throw new Exception($"ARF Limit Exceeded! Your maximum limit is {limit:N0}. You have {consumedLimit:N0} in unsettled ARFs. Available limit: {availableLimit:N0}. Requested: {dto.AdvanceRequested:N0}.");
                }
            }
            else
            {
                // Consume the exception request
                exceptionRequest.IsUsed = true;
                exceptionRequest.UpdatedAt = DateTime.UtcNow;
                _context.ArfExceptionRequests.Update(exceptionRequest);
            }

            int maxId = await _context.AmountRequestForms.MaxAsync(a => (int?)a.Id) ?? 0;
            string arfNumber = $"ARF{(maxId + 1):D5}";

            var userId = _currentUserService.UserId;
            var currentUser = await _context.Users.FindAsync(userId);
            var designation = currentUser?.Designation?.ToLower() ?? "";

            var isManager = _currentUserService.Roles.Contains("Manager") || 
                            _currentUserService.Roles.Contains("Admin") ||
                            _currentUserService.Roles.Contains("Project Director") ||
                            designation == "manager" || 
                            designation == "project director" ||
                            designation == "director" ||
                            currentUser?.Email?.ToLower() == "shahbaz.ali@mytecheng.com";

            var entity = new AmountRequestForm
            {
                ArfNumber = arfNumber,
                EmployeeName = dto.EmployeeName,
                EmployeeEmail = dto.EmployeeEmail,
                AdvanceRequested = dto.AdvanceRequested,
                AccountDetail = dto.AccountDetail,
                DateOfFundRequired = dto.DateOfFundRequired,
                SiteId = dto.SiteId,
                OfficeId = dto.OfficeId,
                CustomSiteName = dto.CustomSiteName,
                ClientName = dto.ClientName,
                PurposeOfAdvance = dto.PurposeOfAdvance,
                Status = isManager ? "Waiting for CEO Approval" : "Waiting for Director Approval"
            };

            _context.AmountRequestForms.Add(entity);
            await _context.SaveChangesAsync();

            if (dto.ProcurementId.HasValue)
            {
                var proc = await _context.ProcurementRequests.FindAsync(dto.ProcurementId.Value);
                if (proc != null)
                {
                    proc.AmountRequestFormId = entity.Id;
                    proc.Status = "ARFCreated";
                    proc.UpdatedAt = DateTime.UtcNow;
                    // If the logged in user is creating it, it's the Procurement Head
                    proc.ProcurementHeadEmail = entity.EmployeeEmail;
                    await _context.SaveChangesAsync();
                }
            }

            if (!isManager)
            {
                // Send Email to Director
                try
                {
                    string subject = $"New Amount Advance Request from {entity.EmployeeName}";
                    string body = $"<p>A new amount advance request of {entity.AdvanceRequested} has been submitted by {entity.EmployeeName}.</p><p><strong>Account Details:</strong> {entity.AccountDetail}</p><p>Please log in to approve or reject.</p><br/><p><a href=\"https://mytecherp.com/login\">Click here to log in to the system</a></p>";
                    await _emailService.SendEmailAsync("shahbaz.ali@mytecheng.com", subject, body);
                }
                catch (Exception) { /* Log or ignore email failure */ }

                // In-App notification to Admins + Director
                await NotifyAdminsAndUserAsync(
                    "shahbaz.ali@mytecheng.com",
                    "New Amount Request Submitted",
                    $"{entity.EmployeeName} submitted a new ARF ({entity.ArfNumber}) for Rs {entity.AdvanceRequested}. Awaiting your approval.",
                    entity.Id
                );

                // --- Notify Faisal Ghani for info only ---
                await SendFaisalArfEmailAsync(entity, $"A new amount advance request of {entity.AdvanceRequested} has been submitted by {entity.EmployeeName}. This is for your information only; it is currently waiting for Director approval.");

                await NotifyAuditorsAsync(
                    "Amount Request Notification",
                    $"{entity.EmployeeName} submitted a new ARF ({entity.ArfNumber}) for Rs {entity.AdvanceRequested}. Awaiting Director approval.",
                    entity.Id
                );
            }
            else
            {
                // Auto-approved by Director, now it goes to CEO
                try
                {
                    string subject = $"Amount Advance Request Approval Required - {entity.EmployeeName}";
                    string body = $"<p>An amount advance request of {entity.AdvanceRequested} by {entity.EmployeeName} has been automatically approved by the Director and requires your approval.</p><p><strong>Account Details:</strong> {entity.AccountDetail}</p><br/><p><a href=\"https://mytecherp.com/login\">Click here to log in to the system</a></p>";
                    await _emailService.SendEmailAsync("munawar.hasan@mytecheng.com", subject, body);
                }
                catch (Exception) { }

                // In-App notification to CEO (munawar.hasan)
                try
                {
                    var ceo = await _userManager.FindByEmailAsync("munawar.hasan@mytecheng.com");
                    if (ceo != null)
                    {
                        await _notificationService.CreateNotificationAsync(
                            userId: ceo.Id,
                            title: "ARF Pending Your Approval",
                            message: $"ARF {entity.ArfNumber} by {entity.EmployeeName} (Rs {entity.AdvanceRequested}) has been automatically approved by the Director and is awaiting your approval.",
                            type: "ARF",
                            targetId: entity.Id
                        );
                    }
                }
                catch (Exception) { }

                // --- Notify Faisal Ghani for info only ---
                await SendFaisalArfEmailAsync(entity, $"A new amount advance request of {entity.AdvanceRequested} has been submitted by {entity.EmployeeName}. This is for your information only; it is currently waiting for CEO approval.");

                // In-App notification to Faisal Ghani
                await NotifyAuditorsAsync(
                    "Amount Request Notification",
                    $"{entity.EmployeeName} submitted ARF {entity.ArfNumber} for Rs {entity.AdvanceRequested}. Awaiting CEO approval.",
                    entity.Id
                );
            }

            return await GetByIdAsync(entity.Id);
        }

        public async Task<AmountRequestFormDto> ApproveAsync(int id, ApproveAmountRequestDto dto)
        {
            var entity = await _context.AmountRequestForms.FirstOrDefaultAsync(a => a.Id == id);
            if (entity == null) throw new Exception("Form not found");

            if (dto.ApproverRole == "Director")
            {
                entity.DirectorName = dto.ApproverName;
                entity.DirectorApprovalDate = DateTime.UtcNow;
                entity.DirectorComment = dto.Comment;

                if (dto.IsApproved)
                {
                    // Every ARF must go through CEO after Director — no amount condition
                    entity.Status = "Waiting for CEO Approval";
                    // Send Email + In-App notification to CEO
                    try
                    {
                        string subject = $"Amount Advance Request Approval Required - {entity.EmployeeName}";
                        string body = $"<p>An amount advance request of {entity.AdvanceRequested} by {entity.EmployeeName} has been approved by the Director and requires your approval.</p><p><strong>Account Details:</strong> {entity.AccountDetail}</p><br/><p><a href=\"https://mytecherp.com/login\">Click here to log in to the system</a></p>";
                        await _emailService.SendEmailAsync("munawar.hasan@mytecheng.com", subject, body);
                    }
                    catch (Exception) { }

                    // In-App notification to CEO (munawar.hasan)
                    try
                    {
                        var ceo = await _userManager.FindByEmailAsync("munawar.hasan@mytecheng.com");
                        if (ceo != null)
                        {
                            await _notificationService.CreateNotificationAsync(
                                userId: ceo.Id,
                                title: "ARF Pending Your Approval",
                                message: $"ARF {entity.ArfNumber} by {entity.EmployeeName} (Rs {entity.AdvanceRequested}) has been approved by the Director and is awaiting your approval.",
                                type: "ARF",
                                targetId: entity.Id
                            );
                        }
                    }
                    catch (Exception) { }
                }
                else
                {
                    entity.Status = "Rejected by Director";
                }
            }
            else if (dto.ApproverRole == "CEO")
            {
                entity.CeoName = dto.ApproverName;
                entity.CeoApprovalDate = DateTime.UtcNow;
                entity.CeoComment = dto.Comment;

                if (dto.IsApproved)
                {
                    entity.Status = "Approved - Ready for Accounts";
                    await SendFaisalArfEmailAsync(entity, $"An amount advance request of {entity.AdvanceRequested} by {entity.EmployeeName} has been fully approved and is ready for release.");

                    // In-App notification to Faisal Ghani (Accounts Head)
                    await NotifyAuditorsAsync(
                        "ARF Ready for Release",
                        $"ARF {entity.ArfNumber} by {entity.EmployeeName} (Rs {entity.AdvanceRequested}) has been approved by the CEO and is ready for release.",
                        entity.Id
                    );
                }
                else
                {
                    entity.Status = "Rejected by CEO";
                }
            }

            await _context.SaveChangesAsync();
            return await GetByIdAsync(entity.Id);
        }

        public async Task<AmountRequestFormDto> ReleaseAmountAsync(int id, AccountsReleaseAmountDto dto, List<Microsoft.AspNetCore.Http.IFormFile>? paymentSlips)
        {
            if (paymentSlips == null || paymentSlips.Count == 0)
            {
                throw new Exception("At least one Payment Slip attachment is required to release the amount.");
            }

            var entity = await _context.AmountRequestForms.Include(a => a.Site).FirstOrDefaultAsync(a => a.Id == id);
            if (entity == null) throw new Exception("Form not found");

            var fileUrls = new List<string>();
            foreach (var paymentSlip in paymentSlips)
            {
                var fileName = $"paymentslip_{id}_{Guid.NewGuid()}_{paymentSlip.FileName}";
                var fileUrl = await _blobService.UploadAsync(paymentSlip, fileName);
                fileUrls.Add(fileUrl);
            }
            
            var serializedUrls = System.Text.Json.JsonSerializer.Serialize(fileUrls);

            entity.AccountsDateOfEntry ??= dto.DateOfEntry;
            entity.AccountsDateOfFundReleased = dto.DateOfFundReleased;
            entity.AccountsReleasedAmount = (entity.AccountsReleasedAmount ?? 0) + dto.ReleasedAmount;
            entity.AccountsRemarks = dto.Remarks;
            
            bool isFullRelease = entity.AccountsReleasedAmount >= entity.AdvanceRequested;
            entity.Status = isFullRelease ? "Released" : "Partially Paid";

            var payment = new AmountRequestPayment
            {
                AmountRequestFormId = id,
                ReleasedDate = dto.DateOfFundReleased,
                ReleasedAmount = dto.ReleasedAmount,
                ReceivedBy = entity.EmployeeName,
                ModeOfPayment = "Transfer",
                Remarks = "Auto-generated from Release Details: " + dto.Remarks,
                PaymentSlipUrl = serializedUrls
            };
            _context.AmountRequestPayments.Add(payment);

            try
            {
                if (!string.IsNullOrEmpty(entity.EmployeeEmail))
                {
                    try 
                    {
                        string paymentType = isFullRelease ? "fully" : "partially";
                        string subject = $"Amount Request {char.ToUpper(paymentType[0]) + paymentType.Substring(1)} Released - {entity.EmployeeName}";
                        string body = $"<p>Dear {entity.EmployeeName},</p><p>Your ARF is approved. ARF Number is <strong>{entity.ArfNumber}</strong>.</p><p>Your amount advance request of {entity.AdvanceRequested} has been {paymentType} released (Amount released in this transaction: {dto.ReleasedAmount}). Please add your expenses against this ARF Number.</p><p>Remarks: {dto.Remarks}</p>";
                        await _emailService.SendEmailAsync(entity.EmployeeEmail, subject, body);
                    }
                    catch (Exception) { }
                    
                    try
                    {
                        var tenantId = _currentUserService.TenantId;
                        var user = tenantId.HasValue
                            ? await _context.Users.FirstOrDefaultAsync(u => u.Email == entity.EmployeeEmail && u.TenantId == tenantId.Value)
                            : await _context.Users.FirstOrDefaultAsync(u => u.Email == entity.EmployeeEmail);
                            
                        if (user != null)
                        {
                            string siteNameStr = entity.Site?.Name ?? entity.CustomSiteName ?? "N/A";
                            await _notificationService.CreateNotificationAsync(
                                user.Id,
                                "Amount Released",
                                $"Your payment has been released. ARF Number: {entity.ArfNumber}, Amount: Rs {dto.ReleasedAmount}, Site: {siteNameStr}",
                                "ArfReleased",
                                entity.Id
                            );
                        }
                    }
                    catch (Exception) { }
                }
            }
            catch (Exception) { }

            await _context.SaveChangesAsync();
            return await GetByIdAsync(entity.Id);
        }

        public async Task<AmountRequestFormDto> AddPaymentAsync(int id, CreateAmountRequestPaymentDto dto)
        {
            var entity = await _context.AmountRequestForms.FirstOrDefaultAsync(a => a.Id == id);
            if (entity == null) throw new Exception("Form not found");

            var payment = new AmountRequestPayment
            {
                AmountRequestFormId = id,
                ReleasedDate = dto.ReleasedDate,
                ReleasedAmount = dto.ReleasedAmount,
                ReceivedBy = dto.ReceivedBy,
                ModeOfPayment = dto.ModeOfPayment,
                Remarks = dto.Remarks
            };

            _context.AmountRequestPayments.Add(payment);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task<AmountRequestFormDto> UploadAttachmentAsync(int id, Microsoft.AspNetCore.Http.IFormFile file)
        {
            var entity = await _context.AmountRequestForms.FindAsync(id);
            if (entity == null)
                throw new Exception("Form not found");

            var fileName = $"arf_{id}_{Guid.NewGuid()}_{file.FileName}";
            var fileUrl = await _blobService.UploadAsync(file, fileName);

            var attachments = entity.Attachments;
            attachments.Add(fileUrl);
            entity.Attachments = attachments;

            await _context.SaveChangesAsync();
            return MapToDto(entity);
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.AmountRequestForms.FirstOrDefaultAsync(a => a.Id == id);
            if (entity != null)
            {
                var userId = _currentUserService.UserId;
                var currentUser = await _context.Users.FindAsync(userId);
                var designation = currentUser?.Designation?.ToLower() ?? "";

                var isManagerOrAdmin = _currentUserService.Roles.Contains("Manager") || 
                                       _currentUserService.Roles.Contains("Admin") ||
                                       _currentUserService.Roles.Contains("Project Director") ||
                                       _currentUserService.Roles.Contains("CEO") ||
                                       designation == "manager" || 
                                       designation == "project director" ||
                                       designation == "director" ||
                                       designation == "ceo";

                if (!isManagerOrAdmin)
                {
                    if (entity.Status != "Waiting for Director Approval" && !entity.Status.Contains("Rejected"))
                    {
                        throw new Exception("You cannot delete an ARF that has already been approved or processed.");
                    }
                }

                entity.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task BulkDeleteAsync(List<int> ids)
        {
            var userId = _currentUserService.UserId;
            var currentUser = await _context.Users.FindAsync(userId);
            var designation = currentUser?.Designation?.ToLower() ?? "";

            var isManagerOrAdmin = _currentUserService.Roles.Contains("Manager") || 
                                   _currentUserService.Roles.Contains("Admin") ||
                                   _currentUserService.Roles.Contains("Project Director") ||
                                   _currentUserService.Roles.Contains("CEO") ||
                                   designation == "manager" || 
                                   designation == "project director" ||
                                   designation == "director" ||
                                   designation == "ceo";

            var entities = await _context.AmountRequestForms.Where(a => ids.Contains(a.Id)).ToListAsync();
            foreach (var entity in entities)
            {
                if (!isManagerOrAdmin)
                {
                    if (entity.Status != "Waiting for Director Approval" && !entity.Status.Contains("Rejected"))
                    {
                        throw new Exception($"You cannot delete ARF #{entity.Id} because it has already been approved or processed.");
                    }
                }
                entity.IsDeleted = true;
            }
            await _context.SaveChangesAsync();
        }

        private async Task SendFaisalArfEmailAsync(AmountRequestForm entity, string subjectTemplate)
        {
            try
            {
                var siteName = entity.CustomSiteName;
                if (string.IsNullOrEmpty(siteName) && entity.SiteId.HasValue)
                {
                    var site = await _context.Sites.FindAsync(entity.SiteId);
                    if (site != null) siteName = site.Name;
                }

                var officeName = "";
                if (entity.OfficeId.HasValue)
                {
                    var office = await _context.Offices.FindAsync(entity.OfficeId);
                    if (office != null) officeName = office.Name;
                }

                var location = !string.IsNullOrEmpty(siteName) ? $"Site: {siteName}" : (!string.IsNullOrEmpty(officeName) ? $"Office: {officeName}" : "N/A");

                var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == entity.EmployeeEmail);
                var designation = currentUser?.Designation ?? "N/A";

                var pktZone = TimeZoneInfo.FindSystemTimeZoneById("Pakistan Standard Time");
                var pktTime = TimeZoneInfo.ConvertTimeFromUtc(entity.CreatedAt, pktZone);

                string body = $@"
                    <p>{subjectTemplate}</p>
                    <br/>
                    <p><strong>ARF Number:</strong> {entity.ArfNumber}</p>
                    <p><strong>Requestee Name:</strong> <mark>{entity.EmployeeName}</mark></p>
                    <p><strong>Requestee Designation/Department:</strong> <mark>{designation}</mark></p>
                    <p><strong>Location:</strong> <mark>{location}</mark></p>
                    <p><strong>Amount Requested:</strong> Rs {entity.AdvanceRequested}</p>
                    <p><strong>Account Details:</strong> {entity.AccountDetail}</p>
                    <p><strong>Current Status:</strong> {entity.Status}</p>
                    <p><strong>Requested Time:</strong> {pktTime.ToString("g")} (PKT)</p>
                    <br/>
                    <p><a href=""https://mytecherp.com/login"">Click here to log in to the system</a></p>
                ";

                string subject = $"Amount Request Notification - {entity.EmployeeName} ({entity.ArfNumber})";

                await _emailService.SendEmailAsync("faisal.ghani@mytecheng.com", subject, body);
                await _emailService.SendEmailAsync("abdul.majeed@mytecheng.com", subject, body);
                await _emailService.SendEmailAsync("asma@mytecheng.com", subject, body);
                await _emailService.SendEmailAsync("usamamalikwork1@gmail.com", subject, body);
            }
            catch (Exception) { }
        }
    }
}
