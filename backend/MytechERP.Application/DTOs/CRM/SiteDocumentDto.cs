using System;

namespace MytechERP.Application.DTOs.CRM
{
    public class SiteDocumentDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        
        public string DocumentType { get; set; } = string.Empty;
        
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }

        public int? SecondaryCustomerId { get; set; }
        public string? SecondaryCustomerName { get; set; }

        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public string UploadedByUserId { get; set; } = string.Empty;
    }
}
