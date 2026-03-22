using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateWorkOrderDto
    {
        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int ContractId { get; set; } 

        public DateTime ScheduledDate { get; set; }

        public string? TechnicianId { get; set; }
        public int AssetId { get; set; }
    }
}
