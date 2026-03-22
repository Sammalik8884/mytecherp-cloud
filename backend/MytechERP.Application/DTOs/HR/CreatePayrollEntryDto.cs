using MytechERP.domain.Entities.HR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.HR
{
    public class CreatePayrollEntryDto
    {
        public string UserId { get; set; } = string.Empty;
        public int? WorkOrderId { get; set; }
        public PayrollEntryType Type { get; set; } 
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
