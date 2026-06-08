using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateIncidentRecordDto
    {
        public int SiteId { get; set; }
        
        public string Doc { get; set; } = string.Empty;
        public string Issue { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }

        public ICollection<CreateIncidentRecordItemDto> Items { get; set; }

        public CreateIncidentRecordDto()
        {
            Items = new List<CreateIncidentRecordItemDto>();
        }
    }

    public class CreateIncidentRecordItemDto
    {
        public DateTime? Date { get; set; }
        public string DescriptionOfIncident { get; set; } = string.Empty;
        public string ToWhom { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string CorrectiveAction { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }
}
