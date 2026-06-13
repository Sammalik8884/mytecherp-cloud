using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.HR;
using MytechERP.Application.Interfaces;
using MytechERP.Application.Interfaces.HR;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.HR;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services.HR
{
    public class ApplicationFormService : IApplicationFormService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobService _blobService;
        private readonly IEmailService _emailService;
        private readonly ICurrentUserService _currentUserService;
        private readonly UserManager<AppUser> _userManager;

        public ApplicationFormService(
            ApplicationDbContext context,
            IBlobService blobService,
            IEmailService emailService,
            ICurrentUserService currentUserService,
            UserManager<AppUser> userManager)
        {
            _context = context;
            _blobService = blobService;
            _emailService = emailService;
            _currentUserService = currentUserService;
            _userManager = userManager;
        }

        public async Task<ApplicationFormDto> CreateAsync(CreateApplicationFormDto dto, string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            
            var entity = new ApplicationForm
            {
                ApplicantName = dto.ApplicantName,
                Designation = dto.Designation,
                ApplicationDate = dto.ApplicationDate,
                EmployeeCode = dto.EmployeeCode,
                PhoneNumber = dto.PhoneNumber,
                EmployeeType = dto.EmployeeType,
                Subject = dto.Subject,
                Description = dto.Description,
                Status = "Pending",
                Attachments = new List<ApplicationFormAttachment>(),
                CreatedByUserId = userId
            };

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                foreach (var file in dto.Attachments)
                {
                    var fileUrl = await _blobService.UploadFileAsync(file, "application-forms");
                    entity.Attachments.Add(new ApplicationFormAttachment
                    {
                        FileName = file.FileName,
                        FileUrl = fileUrl
                    });
                }
            }

            _context.ApplicationForms.Add(entity);
            await _context.SaveChangesAsync();

            // Send notification to shahbaz.ali@mytecheng.com
            string subject = $"New Application Form: {entity.Subject} by {entity.ApplicantName}";
            string body = $@"
                <h3>New Application Form Submitted</h3>
                <p><strong>Applicant Name:</strong> {entity.ApplicantName}</p>
                <p><strong>Designation:</strong> {entity.Designation}</p>
                <p><strong>Employee Type:</strong> {entity.EmployeeType}</p>
                <p><strong>Subject:</strong> {entity.Subject}</p>
                <p><strong>Description:</strong><br/>{entity.Description}</p>
                <p>Please log in to the system to review and approve/reject.</p>
            ";

            try
            {
                await _emailService.SendEmailAsync("shahbaz.ali@mytecheng.com", subject, body);
            }
            catch (Exception) { /* Ignore email failure */ }

            return MapToDto(entity);
        }

        public async Task<List<ApplicationFormDto>> GetAllAsync(string userRole, string userEmail)
        {
            var query = _context.ApplicationForms.Include(a => a.Attachments).AsQueryable();

            if (userRole != "Admin" && userRole != "Manager" && userRole != "Accounts Head" && userEmail?.ToLower() != "shahbaz.ali@mytecheng.com" && userEmail?.ToLower() != "munawar.hasan@mytecheng.com")
            {
                var userId = _currentUserService.UserId;
                query = query.Where(a => a.CreatedByUserId == userId);
            }

            var entities = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
            return entities.Select(MapToDto).ToList();
        }

        public async Task<ApplicationFormDto> GetByIdAsync(int id)
        {
            var entity = await _context.ApplicationForms
                .Include(a => a.Attachments)
                .FirstOrDefaultAsync(a => a.Id == id);
            
            if (entity == null) return null;
            return MapToDto(entity);
        }

        public async Task<ApplicationFormDto> UpdateStatusAsync(int id, UpdateApplicationFormStatusDto dto, string userEmail)
        {
            var entity = await _context.ApplicationForms
                .Include(a => a.Attachments)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (entity == null) return null;

            entity.Status = dto.Status;

            if (dto.Status == "Your application is rejected")
            {
                entity.RejectionRemarks = dto.Remarks;
                
                // Notify Applicant
                var applicant = await _userManager.FindByIdAsync(entity.CreatedByUserId);
                if (applicant != null && !string.IsNullOrEmpty(applicant.Email))
                {
                    string body = $@"
                        <h3>Application Rejected</h3>
                        <p>Your application '{entity.Subject}' has been rejected.</p>
                        <p><strong>Remarks:</strong> {dto.Remarks}</p>
                    ";
                    try { await _emailService.SendEmailAsync(applicant.Email, $"Application Rejected: {entity.Subject}", body); } catch { }
                }
            }
            else if (dto.Status == "Approved by Director")
            {
                entity.DirectorRemarks = dto.Remarks;
                
                // Route to Munawar
                string body = $@"
                    <h3>Application Form Approved by Director</h3>
                    <p><strong>Applicant Name:</strong> {entity.ApplicantName}</p>
                    <p><strong>Subject:</strong> {entity.Subject}</p>
                    <p><strong>Director Remarks:</strong> {dto.Remarks}</p>
                    <p>Please log in to review and provide final approval.</p>
                ";
                try { await _emailService.SendEmailAsync("munawar.hasan@mytecheng.com", $"Pending Final Approval: {entity.Subject}", body); } catch { }
            }
            else if (dto.Status == "Approved by CEO")
            {
                entity.CeoRemarks = dto.Remarks;
                
                // Notify Applicant
                var applicant = await _userManager.FindByIdAsync(entity.CreatedByUserId);
                if (applicant != null && !string.IsNullOrEmpty(applicant.Email))
                {
                    string body = $@"
                        <h3>Application Fully Approved</h3>
                        <p>Your application '{entity.Subject}' has been approved by the CEO.</p>
                        <p><strong>Remarks:</strong> {dto.Remarks}</p>
                    ";
                    try { await _emailService.SendEmailAsync(applicant.Email, $"Application Approved: {entity.Subject}", body); } catch { }
                }
            }

            _context.ApplicationForms.Update(entity);
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.ApplicationForms.FindAsync(id);
            if (entity != null)
            {
                _context.ApplicationForms.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        private ApplicationFormDto MapToDto(ApplicationForm entity)
        {
            return new ApplicationFormDto
            {
                Id = entity.Id,
                ApplicantName = entity.ApplicantName,
                Designation = entity.Designation,
                ApplicationDate = entity.ApplicationDate,
                EmployeeCode = entity.EmployeeCode,
                PhoneNumber = entity.PhoneNumber,
                EmployeeType = entity.EmployeeType,
                Subject = entity.Subject,
                Description = entity.Description,
                Status = entity.Status,
                DirectorRemarks = entity.DirectorRemarks,
                CeoRemarks = entity.CeoRemarks,
                RejectionRemarks = entity.RejectionRemarks,
                CreatedAt = entity.CreatedAt,
                Attachments = entity.Attachments?.Select(a => new ApplicationFormAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FileUrl = _blobService.GenerateSasUrl(a.FileUrl, 60, true)
                }).ToList() ?? new List<ApplicationFormAttachmentDto>()
            };
        }
    }
}
