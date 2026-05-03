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

        public ExpenseService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        private ExpenseDto MapToDto(Expense entity)
        {
            var totalExpense = entity.Items?.Sum(i => i.Amount) ?? 0;
            var arfReleased = entity.AmountRequestForm?.AccountsReleasedAmount ?? 0;

            return new ExpenseDto
            {
                Id = entity.Id,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name ?? string.Empty,
                AmountRequestFormId = entity.AmountRequestFormId,
                ArfNumber = entity.AmountRequestForm?.ArfNumber ?? string.Empty,
                CreatedByEmail = entity.CreatedByEmail,
                CreatedAt = entity.CreatedAt,
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
                    Remarks = i.Remarks,
                    FileUrl = i.FileUrl
                }).ToList() ?? new List<ExpenseItemDto>()
            };
        }

        public async Task<ExpenseDto> GetByIdAsync(int id)
        {
            var entity = await _context.Expenses
                .Include(e => e.Site)
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
                .Include(e => e.AmountRequestForm)
                .Include(e => e.Items)
                .AsQueryable();

            if (role != "Admin" && role != "Accounts Head" && email != "shahbaz.ali@mytecheng.com" && email != "munawar.hasan@mytecheng.com")
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
                .Include(e => e.AmountRequestForm)
                .Include(e => e.Items)
                .Where(e => e.SiteId == siteId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<ExpenseDto> CreateAsync(CreateExpenseDto dto)
        {
            var arf = await _context.AmountRequestForms.FindAsync(dto.AmountRequestFormId);
            if (arf == null) throw new Exception("ARF not found");

            var email = _currentUserService.Email ?? string.Empty;

            var entity = new Expense
            {
                SiteId = dto.SiteId,
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
                    Remarks = i.Remarks,
                    FileUrl = i.FileUrl
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

            var arf = await _context.AmountRequestForms.FindAsync(dto.AmountRequestFormId);
            if (arf == null) throw new Exception("ARF not found");

            entity.SiteId = dto.SiteId;
            entity.AmountRequestFormId = dto.AmountRequestFormId;

            _context.ExpenseItems.RemoveRange(entity.Items);

            entity.Items = dto.Items.Select(i => new ExpenseItem
            {
                ExpenseDate = i.ExpenseDate,
                EmployeeName = i.EmployeeName,
                EmployeeDesignation = i.EmployeeDesignation,
                ExpenseType = i.ExpenseType,
                DescriptionItems = i.DescriptionItems,
                Amount = i.Amount,
                Remarks = i.Remarks,
                FileUrl = i.FileUrl
            }).ToList();

            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id);
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Expenses.FindAsync(id);
            if (entity != null)
            {
                entity.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }
    }
}
