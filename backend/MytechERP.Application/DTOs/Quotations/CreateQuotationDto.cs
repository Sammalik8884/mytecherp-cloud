using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Quotations
{
    public class CreateQuotationDto
    {
        [Required]
        public int CustomerId { get; set; }
        public int? OpportunityId { get; set; }
        public int? SiteId { get; set; }

        public int? AssetId { get; set; }

        public string Currency { get; set; } = "PKR";
        public decimal ExchangeRate { get; set; } = 1.0m;

      
        public decimal GlobalCommissionPct { get; set; } = 0;

        public decimal GSTPercentage { get; set; } = 0;
        public decimal IncomeTaxPercentage { get; set; } = 0;
        public decimal Adjustment { get; set; } = 0; 

        public string QuoteMode { get; set; } = "Local";
        public string SupplyColumnMode { get; set; } = "Both";
        public decimal CostFactorPct { get; set; } = 60m;
        public decimal ImportationPct { get; set; } = 13.75m;
        public decimal TransportationPct { get; set; } = 2m;
        public decimal ProfitPct { get; set; } = 15m; 

        [Required]
        public List<CreateQuotationItemDto> Items { get; set; } = new List<CreateQuotationItemDto>();
    }
}