using System;
using System.Collections.Generic;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.HR
{
    public class ApplicationForm : BaseEntity, ISyncableEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public string ApplicantName { get; set; }
        public string Designation { get; set; }
        public DateTime ApplicationDate { get; set; }
        public string? EmployeeCode { get; set; }
        public string PhoneNumber { get; set; }
        public string EmployeeType { get; set; }
        public string Subject { get; set; }
        public string Description { get; set; }
        
        // Status: "Pending", "Approved by Director", "Approved by CEO", "Your application is rejected"
        public string Status { get; set; }
        
        public string? DirectorRemarks { get; set; }
        public string? CeoRemarks { get; set; }
        public string? RejectionRemarks { get; set; }

        public string CreatedByUserId { get; set; }
        public AppUser CreatedByUser { get; set; }

        public ICollection<ApplicationFormAttachment> Attachments { get; set; }
    }
}
