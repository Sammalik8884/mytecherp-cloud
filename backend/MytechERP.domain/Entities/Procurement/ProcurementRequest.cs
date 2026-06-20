using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Entities.Finance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace MytechERP.domain.Entities.Procurement
{
    public class ProcurementRequest : BaseEntity
    {
        [MaxLength(100)]
        public string ProcurementNumber { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(100)]
        public string SupervisorName { get; set; } = string.Empty;

        [Required]
        public string SupervisorEmail { get; set; } = string.Empty;

        public int? SiteId { get; set; }
        public Site? Site { get; set; }

        // Procurement Flow Statuses:
        // PendingPDApproval, RejectedByPD, ApprovedByPD, ARFCreated, ARFApproved, AssignedToExecutive, Completed
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "PendingPDApproval";

        // Project Director Review
        public string? PdEmail { get; set; }
        public string? PdRemarks { get; set; }
        public DateTime? PdApprovalDate { get; set; }

        // Procurement Head processing
        public string? ProcurementHeadEmail { get; set; }

        // Link to ARF
        public int? AmountRequestFormId { get; set; }
        public AmountRequestForm? AmountRequestForm { get; set; }

        // Assignment
        public string? AssignedExecutiveEmail { get; set; }
        public DateTime? AssignedDate { get; set; }

        // Delivery / Completion
        public DateTime? CompletedDate { get; set; }
        public string? DeliveryNoteText { get; set; }
        
        public string DeliveryNoteDocumentsJson { get; set; } = "[]";

        [NotMapped]
        public List<string> DeliveryNoteDocuments
        {
            get => string.IsNullOrEmpty(DeliveryNoteDocumentsJson) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(DeliveryNoteDocumentsJson) ?? new List<string>();
            set => DeliveryNoteDocumentsJson = JsonSerializer.Serialize(value);
        }

        public ICollection<ProcurementRequestItem> Items { get; set; } = new List<ProcurementRequestItem>();
    }
}
