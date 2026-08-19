using System;
using System.Collections.Generic;
using MytechERP.domain.Enums;

namespace MytechERP.Application.DTOs.Quotations
{
    public class SupplyQuotationDto
    {
        public int Id { get; set; }
        public string QuoteNumber { get; set; } = string.Empty;
        public DateTime QuoteDate { get; set; }
        public string QuotationFor { get; set; } = string.Empty;
        public string RevisionNumber { get; set; } = string.Empty;
        public string HeaderToName { get; set; } = string.Empty;
        public string HeaderDesignation { get; set; } = string.Empty;
        public string HeaderCompany { get; set; } = string.Empty;
        public string HeaderLocation { get; set; } = string.Empty;
        public string? TermsAndConditionsJson { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
        public string SupplyColumnsJson { get; set; } = "[]"; 
        
        public List<SupplyQuotationItemDto> Items { get; set; } = new List<SupplyQuotationItemDto>();
    }

    public class SupplyQuotationItemDto
    {
        public int Id { get; set; }
        public int SupplyQuotationId { get; set; }
        public int SNo { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        
        // Dynamic rates mapping
        public string RatesJson { get; set; } = "{}";
        public decimal TotalAmount { get; set; }
    }

    public class CreateSupplyQuotationDto
    {
        public DateTime QuoteDate { get; set; }
        public string QuotationFor { get; set; } = string.Empty;
        public string RevisionNumber { get; set; } = string.Empty;
        public string HeaderToName { get; set; } = string.Empty;
        public string HeaderDesignation { get; set; } = string.Empty;
        public string HeaderCompany { get; set; } = string.Empty;
        public string HeaderLocation { get; set; } = string.Empty;
        public string? TermsAndConditionsJson { get; set; }
        
        // e.g. ["Supply-1 Unit Rate", "Supply-2 Unit Rate"]
        public List<string> SupplyColumns { get; set; } = new List<string>(); 
        
        public List<CreateSupplyQuotationItemDto> Items { get; set; } = new List<CreateSupplyQuotationItemDto>();
    }

    public class CreateSupplyQuotationItemDto
    {
        public int SNo { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        
        // Mapping column name to rate
        public Dictionary<string, decimal> Rates { get; set; } = new Dictionary<string, decimal>();
        public decimal TotalAmount { get; set; }
    }
}
