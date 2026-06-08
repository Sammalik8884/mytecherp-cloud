using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class ProjectSpotCheckSiteItemDto
    {
        public int? Id { get; set; }
        public string ItemText { get; set; } = string.Empty;
        public bool IsYes { get; set; }
        public bool IsNA { get; set; }
        public string? Comments { get; set; }
    }

    public class ProjectSpotCheckSiteDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string? SiteName { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public List<ProjectSpotCheckSiteItemDto> Items { get; set; } = new List<ProjectSpotCheckSiteItemDto>();
        
        public string? UploadedFiles { get; set; }
    }

    public class CreateProjectSpotCheckSiteDto
    {
        public int SiteId { get; set; }
        public List<ProjectSpotCheckSiteItemDto> Items { get; set; } = new List<ProjectSpotCheckSiteItemDto>();
        public string? UploadedFiles { get; set; }
    }
}
