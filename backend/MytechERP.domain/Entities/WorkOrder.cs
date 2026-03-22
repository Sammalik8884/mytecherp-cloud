using Microsoft.AspNetCore.Identity;
using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Enums;
using MytechERP.domain.Quotations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

namespace MytechERP.domain.Entities
{
    public class WorkOrder : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Created;

        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }

        public int? ContractId { get; set; }
        public Contract? Contract { get; set; }

        public string? TechnicianId { get; set; } 

        [ForeignKey("TechnicianId")]
        public AppUser? Technician { get; set; }

        public string? TechnicianNotes { get; set; }
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }
        public List<WorkOrderChecklistResult> Results { get; set; } = new();
        public List<MytechERP.domain.Entities.System.TimeLog> TimeLogs { get; set; } = new();
        
        [ForeignKey("ReferenceQuotationId")]
        public Quotation? ReferenceQuotation { get; set; }
        public int CustomerId { get; set; }
        public int? SiteId { get; set; }
        public int? ReferenceQuotationId { get; set; }
        public InspectionResult Result { get; set; } = InspectionResult.Pending;
        public string? JobNumber { get; set; } = string.Empty;
        public int? AssignedTechnicianId { get; set; }
        
            public JobType JobType { get; set; } = JobType.Maintenance; 

        public DateTime CreatedAt { get; set; }   
        
    }
}

