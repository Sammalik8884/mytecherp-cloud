using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.Finance;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class ExpenseService : IExpenseService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IBlobService _blobService;

        public ExpenseService(ApplicationDbContext context, ICurrentUserService currentUserService, IBlobService blobService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _blobService = blobService;
        }

        private ExpenseDto MapToDto(Expense entity)
        {
            var totalExpense = entity.Items?.Where(i => !i.IsExcessItem).Sum(i => i.Amount) ?? 0;
            var arfReleased = entity.AmountRequestForm?.AccountsReleasedAmount ?? 0;

            return new ExpenseDto
            {
                Id = entity.Id,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name ?? (entity.AmountRequestForm?.CustomSiteName ?? string.Empty),
                OfficeId = entity.OfficeId,
                OfficeName = entity.Office?.Name ?? string.Empty,
                AmountRequestFormId = entity.AmountRequestFormId,
                ArfNumber = entity.AmountRequestForm?.ArfNumber ?? string.Empty,
                CreatedByEmail = entity.CreatedByEmail,
                CreatedAt = entity.CreatedAt,
                Status = entity.Status,
                ReviewerComments = entity.ReviewerComments,
                ReviewedByEmail = entity.ReviewedByEmail,
                ReviewedAt = entity.ReviewedAt,
                TotalExpenseAmount = totalExpense,
                ArfReleasedAmount = arfReleased,
                Items = entity.Items?.Select(i => new ExpenseItemDto
                {
                    Id = i.Id,
                    ExpenseDate = i.ExpenseDate,
                    EmployeeName = i.EmployeeName,
                    EmployeeDesignation = i.EmployeeDesignation,
                    ExpenseType = i.ExpenseType,
                    DescriptionItems = i.DescriptionItems,
                    Amount = i.Amount,
                    IsExcessItem = i.IsExcessItem,
                    Remarks = i.Remarks,
                    FileUrl = string.IsNullOrEmpty(i.FileUrl) ? string.Empty : _blobService.GenerateSasUrl(i.FileUrl, 1440), // 24 hours
                    Attachments = i.Attachments.Select(url => _blobService.GenerateSasUrl(url, 1440)).ToList()
                }).ToList() ?? new List<ExpenseItemDto>()
            };
        }

        public async Task<ExpenseDto> GetByIdAsync(int id)
        {
            var entity = await _context.Expenses
                .Include(e => e.Site)
                .Include(e => e.Office)
                .Include(e => e.AmountRequestForm)
                .Include(e => e.Items)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entity == null) throw new Exception("Expense not found");

            return MapToDto(entity);
        }

        public async Task<List<ExpenseDto>> GetAllAsync()
        {
            var email = _currentUserService.Email?.ToLower();
            var role = _currentUserService.Role;

            var query = _context.Expenses
                .Include(e => e.Site)
                .Include(e => e.Office)
                .Include(e => e.AmountRequestForm)
                .Include(e => e.Items)
                .AsQueryable();

            if (role != "Admin" && role != "Manager" && role != "Accounts Head" && role != "CEO" && role != "Accounts Assistant" && 
                email != "shahbaz.ali@mytecheng.com" && email != "munawar.hasan@mytecheng.com" && email != "asma@mytecheng.com" && email != "faisal.ghani@mytecheng.com")
            {
                query = query.Where(e => e.CreatedByEmail.ToLower() == email);
            }

            var entities = await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
            return entities.Select(MapToDto).ToList();
        }

        public async Task<List<ExpenseDto>> GetBySiteIdAsync(int siteId)
        {
            var entities = await _context.Expenses
                .Include(e => e.Site)
                .Include(e => e.Office)
                .Include(e => e.AmountRequestForm)
                .Include(e => e.Items)
                .Where(e => e.SiteId == siteId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<ExpenseDto> CreateAsync(CreateExpenseDto dto)
        {
            if (dto.AmountRequestFormId.HasValue)
            {
                var arf = await _context.AmountRequestForms.FindAsync(dto.AmountRequestFormId);
                if (arf == null) throw new Exception("ARF not found");
            }

            var email = _currentUserService.Email ?? string.Empty;

            var entity = new Expense
            {
                SiteId = dto.SiteId,
                OfficeId = dto.OfficeId,
                AmountRequestFormId = dto.AmountRequestFormId,
                CreatedByEmail = email,
                Items = dto.Items.Select(i => new ExpenseItem
                {
                    ExpenseDate = i.ExpenseDate,
                    EmployeeName = i.EmployeeName,
                    EmployeeDesignation = i.EmployeeDesignation,
                    ExpenseType = i.ExpenseType,
                    DescriptionItems = i.DescriptionItems,
                    Amount = i.Amount,
                    IsExcessItem = i.IsExcessItem,
                    Remarks = i.Remarks,
                    FileUrl = i.FileUrl,
                    Attachments = i.Attachments
                }).ToList()
            };

            _context.Expenses.Add(entity);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id);
        }

        public async Task<ExpenseDto> UpdateAsync(int id, CreateExpenseDto dto)
        {
            var entity = await _context.Expenses
                .Include(e => e.Items)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entity == null) throw new Exception("Expense not found");

            if (dto.AmountRequestFormId.HasValue)
            {
                var arf = await _context.AmountRequestForms.FindAsync(dto.AmountRequestFormId);
                if (arf == null) throw new Exception("ARF not found");
            }

            entity.SiteId = dto.SiteId;
            entity.OfficeId = dto.OfficeId;
            entity.AmountRequestFormId = dto.AmountRequestFormId;

            // If the expense was previously reviewed and rejected, reset it to Pending (unless Munawar is just updating it)
            if (entity.Status == "Rejected" && _currentUserService.Email?.ToLower() != "munawar.hasan@mytecheng.com")
            {
                entity.Status = "Pending";
            }

            _context.ExpenseItems.RemoveRange(entity.Items);

            entity.Items = dto.Items.Select(i => new ExpenseItem
            {
                ExpenseDate = i.ExpenseDate,
                EmployeeName = i.EmployeeName,
                EmployeeDesignation = i.EmployeeDesignation,
                ExpenseType = i.ExpenseType,
                DescriptionItems = i.DescriptionItems,
                Amount = i.Amount,
                IsExcessItem = i.IsExcessItem,
                Remarks = i.Remarks,
                FileUrl = i.FileUrl,
                Attachments = i.Attachments
            }).ToList();

            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id);
        }

        public async Task<ExpenseDto> ReviewExpenseAsync(int id, ExpenseReviewDto dto, string reviewerEmail)
        {
            var entity = await _context.Expenses.FindAsync(id);
            if (entity == null) throw new Exception("Expense not found");

            entity.Status = dto.Status;
            entity.ReviewerComments = dto.Comments;
            entity.ReviewedByEmail = reviewerEmail;
            entity.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetByIdAsync(entity.Id);
        }

        public async Task DeleteAsync(int id, bool deleteArf = false)
        {
            var entity = await _context.Expenses.FindAsync(id);
            if (entity != null)
            {
                entity.IsDeleted = true;
                
                if (deleteArf && entity.AmountRequestFormId.HasValue)
                {
                    var arf = await _context.AmountRequestForms.FindAsync(entity.AmountRequestFormId.Value);
                    if (arf != null)
                    {
                        arf.IsDeleted = true;
                    }
                }
                
                await _context.SaveChangesAsync();
            }
        }
    }
}
