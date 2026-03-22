using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.HR;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.HR;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class PayrollService : IPayrollService
    {
        private readonly ApplicationDbContext _context;

        public PayrollService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddEntryAsync(CreatePayrollEntryDto dto)
        {
            var entry = new PayrollEntry
            {
                UserId = dto.UserId,
                WorkOrderId = dto.WorkOrderId,
                Type = dto.Type,
                Amount = dto.Amount,
                Description = dto.Description,
                DateIncurred = DateTime.UtcNow
            };

            _context.PayrollEntries.Add(entry);
            await _context.SaveChangesAsync();
            return entry.Id;
        }

        public async Task<Payslip> GeneratePayslipAsync(GeneratePayslipDto dto)
        {
            var profile = await _context.EmployeeProfiles
                .FirstOrDefaultAsync(p => p.UserId == dto.UserId);

            if (profile == null) throw new Exception("Employee Payroll Profile not found.");

            var pendingEntries = await _context.PayrollEntries
                .Where(e => e.UserId == dto.UserId
                         && e.PayslipId == null 
                         && e.DateIncurred >= dto.PeriodStart
                         && e.DateIncurred <= dto.PeriodEnd)
                .ToListAsync();

            decimal totalBonuses = pendingEntries.Where(e => e.Type == PayrollEntryType.Bonus).Sum(e => e.Amount);
            decimal totalPenalties = pendingEntries.Where(e => e.Type == PayrollEntryType.Penalty).Sum(e => e.Amount);

            var payslip = new Payslip
            {
                UserId = dto.UserId,
                PeriodStart = dto.PeriodStart,
                PeriodEnd = dto.PeriodEnd,
                BaseSalaryAmount = profile.MonthlyBaseSalary,
                TotalBonuses = totalBonuses,
                TotalPenalties = totalPenalties,
                NetPay = profile.MonthlyBaseSalary + totalBonuses - totalPenalties,
                Status = PayslipStatus.Draft
            };

            _context.Payslips.Add(payslip);
            await _context.SaveChangesAsync(); 

            foreach (var entry in pendingEntries)
            {
                entry.PayslipId = payslip.Id;
            }

            await _context.SaveChangesAsync();
            return payslip;
        }
        public async Task<int> CreateProfileAsync(CreatePayrollProfileDto dto)
        {
            var existingProfile = await _context.EmployeeProfiles
                .FirstOrDefaultAsync(p => p.UserId == dto.UserId);

            if (existingProfile != null)
                throw new Exception("A payroll profile already exists for this employee.");

            var profile = new EmployeePayrollProfile
            {
                UserId = dto.UserId,
                MonthlyBaseSalary = dto.MonthlyBaseSalary,
                BankAccountNumber = dto.BankAccountNumber,
                BankName = dto.BankName
            };

            _context.EmployeeProfiles.Add(profile);
            await _context.SaveChangesAsync();

            return profile.Id;
        }
        public async Task<bool> ApproveAndPayPayslipAsync(int payslipId)
        {
            var payslip = await _context.Payslips.FindAsync(payslipId);

            if (payslip == null)
                throw new Exception("Payslip not found.");

            if (payslip.Status == PayslipStatus.Paid)
                throw new Exception("This payslip has already been paid.");

            payslip.Status = PayslipStatus.Paid;

            

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<EmployeePayrollProfileDto>> GetAllProfilesAsync()
        {
            var profiles = await _context.EmployeeProfiles.ToListAsync();
            var userIds = profiles.Select(p => p.UserId).Distinct().ToList();
            var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

            return profiles.Select(p => new EmployeePayrollProfileDto
            {
                Id = p.Id,
                UserId = p.UserId,
                EmployeeName = users.ContainsKey(p.UserId) ? users[p.UserId] : "Unknown",
                MonthlyBaseSalary = p.MonthlyBaseSalary,
                BankAccountNumber = p.BankAccountNumber,
                BankName = p.BankName
            });
        }

        public async Task<IEnumerable<PayslipDto>> GetPayslipsAsync()
        {
            var payslips = await _context.Payslips.ToListAsync();
            var userIds = payslips.Select(p => p.UserId).Distinct().ToList();
            var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

            return payslips.Select(p => new PayslipDto
            {
                Id = p.Id,
                UserId = p.UserId,
                EmployeeName = users.ContainsKey(p.UserId) ? users[p.UserId] : "Unknown",
                PeriodStart = p.PeriodStart,
                PeriodEnd = p.PeriodEnd,
                BaseSalaryAmount = p.BaseSalaryAmount,
                TotalBonuses = p.TotalBonuses,
                TotalPenalties = p.TotalPenalties,
                NetPay = p.NetPay,
                Status = (int)p.Status
            });
        }
    }
}
