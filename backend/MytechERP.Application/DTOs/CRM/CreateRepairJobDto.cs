using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateRepairJobDto
    {
        public int QuoteId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string? TechnicianId { get; set; }
    }
}
