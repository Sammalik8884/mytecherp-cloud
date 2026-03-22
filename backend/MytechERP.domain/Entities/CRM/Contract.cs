using Microsoft.EntityFrameworkCore.Query.Internal;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Quotations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.CRM
{
    public class Contract : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate {  get; set; }
        public DateTime EndDate { get; set; }
        public int VisitFrequencyMonths { get; set; }
        public decimal ContractValue { get; set; }
        public bool IsActive { get; set; } = true;
        public int CustomerId {get; set; }
        public Customer? Customer { get; set; }
        public ICollection<ContractItem> ContractItems { get; set; }
        public int? ReferenceQuotationId { get; set; }

        [ForeignKey("ReferenceQuotationId")]
        public Quotation? ReferenceQuotation { get; set; }
    
    }

}
