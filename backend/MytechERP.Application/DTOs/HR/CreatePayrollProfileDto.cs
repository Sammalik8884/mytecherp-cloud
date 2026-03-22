using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.HR
{
    public class CreatePayrollProfileDto
    {
        public string UserId { get; set; } = string.Empty;
        public decimal MonthlyBaseSalary { get; set; }
        public string BankAccountNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
    }
}
