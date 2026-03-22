using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class ContractDto : BaseEntity
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int VisitFrequencyMonths { get; set; }
        public decimal ContractValue { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int VisitsPerYear { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public int Status { get; set; } // 0=Draft, 1=Active, 2=Expired, 3=Cancelled
        public int? ReferenceQuotationId { get; set; }
    }
}
