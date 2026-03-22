using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class UpdateWorkOrderDto
    {
        public int Id { get; set; }
        public string? Description { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string? TechnicianId { get; set; } 
        public string? Status { get; set; } 
        public string? TechnicianNotes { get; set; }
        public int? AssetId { get; set; }   // Allow linking an asset to fix "not linked to Asset" error
    }
}
