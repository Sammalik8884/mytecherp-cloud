using System;

namespace MytechERP.Application.DTOs.HR
{
    public class PayslipDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? EmployeeName { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal BaseSalaryAmount { get; set; }
        public decimal TotalBonuses { get; set; }
        public decimal TotalPenalties { get; set; }
        public decimal NetPay { get; set; }
        public int Status { get; set; } // 0=Draft, 1=Approved, 2=Paid
    }
}
