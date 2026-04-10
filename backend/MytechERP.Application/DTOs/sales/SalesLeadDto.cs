using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Sales
{
    public class SalesLeadDto
    {
        public int Id { get; set; }
        public string LeadNumber { get; set; } = string.Empty;
        
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        
        public string SalesmanUserId { get; set; } = string.Empty;
        public string SalesmanName { get; set; } = string.Empty;
        
        public string Status { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        
        public string? BoqFileUrl { get; set; }
        public string? DrawingsFileUrl { get; set; }
        
        public int? QuotationId { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public int VisitCount { get; set; }
    }
}
