using System;

namespace MytechERP.Application.DTOs.CRM
{
    public class IncidentRecordItemDto
    {
        public int Id { get; set; }
        public DateTime? Date { get; set; }
        public string DescriptionOfIncident { get; set; } = string.Empty;
        public string ToWhom { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string CorrectiveAction { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }
}
