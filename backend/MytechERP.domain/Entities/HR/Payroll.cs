using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.HR
{
    public class EmployeePayrollProfile : BaseEntity
    {
        public string UserId { get; set; } = string.Empty; 

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyBaseSalary { get; set; }

        public string BankAccountNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
    }

    public class PayrollEntry : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string UserId { get; set; } = string.Empty;
        public int? WorkOrderId { get; set; } 
        public int? PayslipId { get; set; } 

        public PayrollEntryType Type { get; set; }
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime DateIncurred { get; set; } = DateTime.UtcNow;
    }

    public class Payslip : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string UserId { get; set; } = string.Empty;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BaseSalaryAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalBonuses { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPenalties { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal NetPay { get; set; } 

        public PayslipStatus Status { get; set; } = PayslipStatus.Draft;

        public virtual ICollection<PayrollEntry> Entries { get; set; } = new List<PayrollEntry>();
    }

    public enum PayrollEntryType { Bonus = 1, Penalty = 2 }
    public enum PayslipStatus { Draft = 0, Approved = 1, Paid = 2 }
}

