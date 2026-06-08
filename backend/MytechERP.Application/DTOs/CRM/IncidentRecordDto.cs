using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class IncidentRecordDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        
        public string Doc { get; set; } = string.Empty;
        public string Issue { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        
        public DateTime CreatedAt { get; set; }

        public ICollection<IncidentRecordItemDto> Items { get; set; }

        public IncidentRecordDto()
        {
            Items = new List<IncidentRecordItemDto>();
        }
    }
}
