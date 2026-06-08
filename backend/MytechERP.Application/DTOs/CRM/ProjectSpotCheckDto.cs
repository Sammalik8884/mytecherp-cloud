using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class ProjectSpotCheckDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string? SiteName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        
        public string? UploadedFiles { get; set; }

        public List<ProjectSpotCheckItemDto> Items { get; set; } = new List<ProjectSpotCheckItemDto>();
    }

    public class ProjectSpotCheckItemDto
    {
        public int Id { get; set; }
        public string ItemText { get; set; } = string.Empty;
        public bool IsYes { get; set; }
        public bool IsNo { get; set; }
        public bool IsNA { get; set; }
        public string Comments { get; set; } = string.Empty;
    }

    public class CreateProjectSpotCheckDto
    {
        public int SiteId { get; set; }
        public string? UploadedFiles { get; set; }

        public List<CreateProjectSpotCheckItemDto> Items { get; set; } = new List<CreateProjectSpotCheckItemDto>();
    }

    public class CreateProjectSpotCheckItemDto
    {
        public string ItemText { get; set; } = string.Empty;
        public bool IsYes { get; set; }
        public bool IsNo { get; set; }
        public bool IsNA { get; set; }
        public string Comments { get; set; } = string.Empty;
    }
}
