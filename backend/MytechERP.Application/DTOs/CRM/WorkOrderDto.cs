using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class WorkOrderDto
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }

       
        public int ContractId { get; set; }
        public string CustomerName { get; set; } = string.Empty; 
        public string SiteName { get; set; } = string.Empty;    
        public string? TechnicianId { get; set; }
        public string? TechnicianName { get; set; }
        public string? TechnicianNotes { get; set; }
        public string Result { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
    }
}
