using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Quotations
{
    public class UpdateQuotationRequest
    {
        public int CustomerId { get; set; } 
        public int? SiteId { get; set; }    
        public DateTime ValidUntil { get; set; }
        public string Currency { get; set; } = "PKR";

        public decimal GSTPercentage { get; set; }
        public decimal IncomeTaxPercentage { get; set; }
        public string? ProvincialTaxType { get; set; }
        public decimal ProvincialTaxPercentage { get; set; }
        public decimal Adjustment { get; set; } 

        public List<QuotationItemDto> Items { get; set; } = new();
        public string? TermsAndConditionsJson { get; set; }
        public bool ShowStamp { get; set; }
    }
}
