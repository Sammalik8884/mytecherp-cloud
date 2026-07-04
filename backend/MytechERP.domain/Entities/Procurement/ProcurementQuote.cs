using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.Procurement
{
    public class ProcurementQuote : BaseEntity
    {
        public int ProcurementRequestId { get; set; }

        [ForeignKey("ProcurementRequestId")]
        public ProcurementRequest ProcurementRequest { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string VendorName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? CityName { get; set; }

        [MaxLength(100)]
        public string? ContactPerson { get; set; }

        [MaxLength(50)]
        public string? ContactNumber { get; set; }

        [MaxLength(200)]
        public string? BankAccountName { get; set; }

        [MaxLength(100)]
        public string? BankName { get; set; }

        [MaxLength(100)]
        public string? AccountNumber { get; set; }

        public decimal TotalAmount { get; set; }

        public bool IsSelected { get; set; } = false;

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ProcurementQuoteItem> QuoteItems { get; set; } = new List<ProcurementQuoteItem>();
    }
}
