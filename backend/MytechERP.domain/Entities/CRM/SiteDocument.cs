using MytechERP.domain.Common;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.CRM
{
    public class SiteDocument : BaseEntity
    {
        public int SiteId { get; set; }
        public Site? Site { get; set; }

        public string DocumentType { get; set; } = string.Empty;

        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public int? SecondaryCustomerId { get; set; }
        [ForeignKey("SecondaryCustomerId")]
        public Customer? SecondaryCustomer { get; set; }

        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        
        public string UploadedByUserId { get; set; } = string.Empty;
    }
}
