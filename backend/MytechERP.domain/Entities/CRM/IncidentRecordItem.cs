using System;

namespace MytechERP.domain.Entities.CRM
{
    public class IncidentRecordItem
    {
        public int Id { get; set; }
        
        public int IncidentRecordId { get; set; }
        public IncidentRecord? IncidentRecord { get; set; }
        
        public DateTime? Date { get; set; }
        public string DescriptionOfIncident { get; set; } = string.Empty;
        public string ToWhom { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string CorrectiveAction { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }
}
