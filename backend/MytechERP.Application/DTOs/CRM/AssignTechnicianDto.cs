using System;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.CRM
{
    public class AssignTechnicianDto
    {
        [Required]
        public string TechnicianId { get; set; } = string.Empty;
    }
}
