using System;

namespace MytechERP.Application.DTOs.Sales
{
    public class CreateInitialClientVisitDto
    {
        // Customer Details
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? TaxNumber { get; set; }
        public string? Address { get; set; }
        
        // New Customer Attributes
        public string? ContactPersonName { get; set; }
        public bool HasVisitingCard { get; set; }
        public string? ContractorCompanyName { get; set; }
        public string? FurtherDetails { get; set; }

        // Site Attributes
        public string SiteName { get; set; } = string.Empty;
        public string SiteCity { get; set; } = string.Empty;
        public string SiteAddress { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? ProjectStatus { get; set; }

        // Initial Visit & Lead Details
        public string? Remarks { get; set; }
        public string? SalespersonSignatureName { get; set; }
    }
}
