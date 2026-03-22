using MytechERP.Application.DTOs.HR;
using MytechERP.domain.Entities.HR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IPayrollService
    {
        Task<int> AddEntryAsync(CreatePayrollEntryDto dto);
        Task<Payslip> GeneratePayslipAsync(GeneratePayslipDto dto);
        Task<int> CreateProfileAsync(CreatePayrollProfileDto dto);
        Task<bool> ApproveAndPayPayslipAsync(int payslipId);
        Task<IEnumerable<EmployeePayrollProfileDto>> GetAllProfilesAsync();
        Task<IEnumerable<PayslipDto>> GetPayslipsAsync();
    }
}
