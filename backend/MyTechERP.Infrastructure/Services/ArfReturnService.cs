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
    public class ArfReturnService : IArfReturnService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public ArfReturnService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<List<ArfReturnDto>> GetAllAsync()
        {
            var email = _currentUserService.Email;
            var role = _currentUserService.Role;

            var query = _context.ArfReturns.Include(r => r.AmountRequestForm).AsQueryable();

            if (role != "Admin" && role != "Manager" && role != "Accounts Head" && role != "CEO" && 
                email != "shahbaz.ali@mytecheng.com" && email != "munawar.hasan@mytecheng.com" && email != "asma@mytecheng.com" && email != "faisal.ghani@mytecheng.com" && email != "abdul.majeed@mytecheng.com")
            {
                query = query.Where(r => r.ReturnedByEmail == email);
            }

            var entities = await query.OrderByDescending(r => r.ReturnDate).ToListAsync();

            return entities.Select(e => new ArfReturnDto
            {
                Id = e.Id,
                AmountRequestFormId = e.AmountRequestFormId,
                ArfNumber = e.AmountRequestForm?.ArfNumber ?? "",
                ReturnAmount = e.ReturnAmount,
                Details = e.Details,
                ReturnDate = e.ReturnDate,
                ReturnedByEmail = e.ReturnedByEmail,
                IsDebt = e.IsDebt
            }).ToList();
        }

        public async Task<ArfReturnDto> CreateAsync(CreateArfReturnDto dto)
        {
            var email = _currentUserService.Email ?? "";
            
            var arf = await _context.AmountRequestForms.FindAsync(dto.AmountRequestFormId);
            if (arf == null) throw new Exception("ARF not found");

            var existingReturns = await _context.ArfReturns.Where(r => r.AmountRequestFormId == dto.AmountRequestFormId).SumAsync(r => r.ReturnAmount);
            if (existingReturns + dto.ReturnAmount > arf.AdvanceRequested)
            {
                throw new Exception($"Return amount exceeds ARF balance. Maximum returnable: {arf.AdvanceRequested - existingReturns}");
            }

            bool isDebt = arf.Status.Contains("Released") || arf.Status.Contains("Paid");

            var entity = new ArfReturn
            {
                AmountRequestFormId = dto.AmountRequestFormId,
                ReturnAmount = dto.ReturnAmount,
                Details = dto.Details,
                ReturnedByEmail = email,
                ReturnDate = DateTime.UtcNow,
                IsDebt = isDebt
            };

            _context.ArfReturns.Add(entity);
            await _context.SaveChangesAsync();

            return new ArfReturnDto
            {
                Id = entity.Id,
                AmountRequestFormId = entity.AmountRequestFormId,
                ArfNumber = arf.ArfNumber,
                ReturnAmount = entity.ReturnAmount,
                Details = entity.Details,
                ReturnDate = entity.ReturnDate,
                ReturnedByEmail = entity.ReturnedByEmail,
                IsDebt = entity.IsDebt
            };
        }

        public async Task<decimal> GetDebtBalanceAsync(string email)
        {
            var debtReturns = await _context.ArfReturns
                .Where(r => r.ReturnedByEmail == email && r.IsDebt)
                .SumAsync(r => r.ReturnAmount);

            var debtExpenses = await _context.Expenses
                .Include(e => e.Items)
                .Where(e => e.CreatedByEmail == email && e.IsPaidByDebt && !e.IsDeleted && e.Status != "Rejected")
                .ToListAsync();

            decimal clearedDebt = 0;
            foreach (var e in debtExpenses)
            {
                clearedDebt += e.Items.Sum(i => i.Amount);
            }

            return debtReturns - clearedDebt > 0 ? debtReturns - clearedDebt : 0;
        }
    }
}
