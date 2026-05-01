using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
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

        public AmountRequestFormService(ApplicationDbContext context, ICurrentUserService currentUserService, IEmailService emailService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _emailService = emailService;
        }

        private AmountRequestFormDto MapToDto(AmountRequestForm entity)
        {
            return new AmountRequestFormDto
            {
                Id = entity.Id,
                CreatedAt = entity.CreatedAt,
                EmployeeName = entity.EmployeeName,
                EmployeeEmail = entity.EmployeeEmail,
                AdvanceRequested = entity.AdvanceRequested,
                AccountDetail = entity.AccountDetail,
                DateOfFundRequired = entity.DateOfFundRequired,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name,
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
                Payments = entity.Payments?.Select(p => new AmountRequestPaymentDto
                {
                    Id = p.Id,
                    ReleasedDate = p.ReleasedDate,
                    ReleasedAmount = p.ReleasedAmount,
                    ReceivedBy = p.ReceivedBy,
                    ModeOfPayment = p.ModeOfPayment,
                    Remarks = p.Remarks
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
            var entities = await _context.AmountRequestForms
                .Include(a => a.Site)
                .Include(a => a.Payments)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<AmountRequestFormDto> CreateAsync(CreateAmountRequestFormDto dto)
        {
            var entity = new AmountRequestForm
            {
                EmployeeName = dto.EmployeeName,
                EmployeeEmail = dto.EmployeeEmail,
                AdvanceRequested = dto.AdvanceRequested,
                AccountDetail = dto.AccountDetail,
                DateOfFundRequired = dto.DateOfFundRequired,
                SiteId = dto.SiteId,
                CustomSiteName = dto.CustomSiteName,
                ClientName = dto.ClientName,
                PurposeOfAdvance = dto.PurposeOfAdvance,
                Status = "Waiting for Director Approval"
            };

            _context.AmountRequestForms.Add(entity);
            await _context.SaveChangesAsync();

            // Send Email to Director
            try
            {
                string subject = $"New Amount Advance Request from {entity.EmployeeName}";
                string body = $"<p>A new amount advance request of {entity.AdvanceRequested} has been submitted by {entity.EmployeeName}.</p><p>Please log in to approve or reject.</p>";
                await _emailService.SendEmailAsync("shahbaz.ali@mytecheng.com", subject, body);
            }
            catch (Exception) { /* Log or ignore email failure */ }

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
                    if (entity.AdvanceRequested > 50000)
                    {
                        entity.Status = "Waiting for CEO Approval";
                        // Send Email to CEO
                        try
                        {
                            string subject = $"Amount Advance Request Approval Required - {entity.EmployeeName}";
                            string body = $"<p>An amount advance request of {entity.AdvanceRequested} by {entity.EmployeeName} has been approved by the Director and requires your approval.</p>";
                            await _emailService.SendEmailAsync("munawar.hasan@mytecheng.com", subject, body);
                        }
                        catch (Exception) { }
                    }
                    else
                    {
                        entity.Status = "Approved - Ready for Accounts";
                        try
                        {
                            string subject = $"Amount Request Ready for Release - {entity.EmployeeName}";
                            string body = $"<p>An amount advance request of {entity.AdvanceRequested} by {entity.EmployeeName} has been fully approved and is ready for release.</p>";
                            await _emailService.SendEmailAsync("faisal.ghani@mytecheng.com", subject, body);
                        }
                        catch (Exception) { }
                    }
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
                    try
                    {
                        string subject = $"Amount Request Ready for Release - {entity.EmployeeName}";
                        string body = $"<p>An amount advance request of {entity.AdvanceRequested} by {entity.EmployeeName} has been fully approved and is ready for release.</p>";
                        await _emailService.SendEmailAsync("faisal.ghani@mytecheng.com", subject, body);
                    }
                    catch (Exception) { }
                }
                else
                {
                    entity.Status = "Rejected by CEO";
                }
            }

            await _context.SaveChangesAsync();
            return await GetByIdAsync(entity.Id);
        }

        public async Task<AmountRequestFormDto> ReleaseAmountAsync(int id, AccountsReleaseAmountDto dto)
        {
            var entity = await _context.AmountRequestForms.FirstOrDefaultAsync(a => a.Id == id);
            if (entity == null) throw new Exception("Form not found");

            entity.AccountsDateOfEntry = dto.DateOfEntry;
            entity.AccountsDateOfFundReleased = dto.DateOfFundReleased;
            entity.AccountsReleasedAmount = dto.ReleasedAmount;
            entity.AccountsRemarks = dto.Remarks;
            entity.Status = "Released";

            try
            {
                if (!string.IsNullOrEmpty(entity.EmployeeEmail))
                {
                    string subject = $"Amount Request Released - {entity.EmployeeName}";
                    string body = $"<p>Dear {entity.EmployeeName},</p><p>Your amount advance request of {entity.AdvanceRequested} has been released.</p><p>Remarks: {dto.Remarks}</p>";
                    await _emailService.SendEmailAsync(entity.EmployeeEmail, subject, body);
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

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.AmountRequestForms.FirstOrDefaultAsync(a => a.Id == id);
            if (entity != null)
            {
                entity.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }
    }
}
