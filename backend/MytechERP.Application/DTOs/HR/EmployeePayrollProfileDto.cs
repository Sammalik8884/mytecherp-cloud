using System;

namespace MytechERP.Application.DTOs.HR
{
    public class EmployeePayrollProfileDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? EmployeeName { get; set; }
        public decimal MonthlyBaseSalary { get; set; }
        public string BankAccountNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
    }
}
