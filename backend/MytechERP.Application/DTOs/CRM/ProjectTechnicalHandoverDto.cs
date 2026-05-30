using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace MytechERP.Application.DTOs.CRM
{
    public class ProjectTechnicalHandoverAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
    }

    public class ProjectTechnicalHandoverDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public int TenantId { get; set; }
        
        public int? CustomerId { get; set; }
        public string CustomerName { get; set; }
        
        public int? SecondaryCustomerId { get; set; }
        public string SecondaryCustomerName { get; set; }
        
        public string CreatedByUserName { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public List<ProjectTechnicalHandoverAttachmentDto> Attachments { get; set; } = new List<ProjectTechnicalHandoverAttachmentDto>();
    }

    public class CreateProjectTechnicalHandoverDto
    {
        public int SiteId { get; set; }
        public int? CustomerId { get; set; }
        public int? SecondaryCustomerId { get; set; }
        public List<IFormFile> Attachments { get; set; }
    }
}
