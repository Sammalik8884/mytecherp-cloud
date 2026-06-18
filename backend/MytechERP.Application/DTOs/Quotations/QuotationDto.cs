using System;
using System.Collections.Generic;
using static MytechERP.domain.Quotations.Quotation;

namespace MytechERP.Application.DTOs.Quotations
{
    public class QuotationDto
    {
        
        public int Id { get; set; }
        public string QuoteNumber { get; set; }
        public DateTime ValidUntil { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string QuoteMode { get; set; } = "Local";
        public string SupplyColumnMode { get; set; } = "Both";

        public int CustomerId { get; set; }
        public string CustomerName { get; set; } 
        public string? SiteName { get; set; }    

        public string Currency { get; set; }

        public decimal SubTotal { get; set; }

        public decimal GSTPercentage { get; set; }
        public decimal GSTAmount { get; set; }
        public decimal IncomeTaxPercentage { get; set; }
        public decimal IncomeTaxAmount { get; set; }

        public string? ProvincialTaxType { get; set; }
        public decimal ProvincialTaxPercentage { get; set; }
        public decimal ProvincialTaxAmount { get; set; }

        public decimal Adjustment { get; set; }
        public decimal GrandTotal { get; set; }

        public int RevisionNumber { get; set; }
        public string ProjectCode { get; set; } = "FPS";
        public string? QuoteHeadline { get; set; }
        public string? ContactPersonName { get; set; }
        public string? TermsAndConditionsJson { get; set; }

        public string? PreparedByName { get; set; }
        public string? PreparedByEmail { get; set; }
        public string? PreparedByPhone { get; set; }
        public string? PreparedByDesignation { get; set; }

        public List<QuotationItemDto> Items { get; set; } = new List<QuotationItemDto>();
    }
}