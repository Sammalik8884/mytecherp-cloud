using System;
using System.Collections.Generic;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.HR
{
    public class VehicleTravelForm : BaseEntity, ISyncableEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public string EmployeeName { get; set; }
        public string EmployeeId { get; set; }
        public string Contact { get; set; }
        
        public string VehicleName { get; set; }
        public string RegistrationNumber { get; set; }
        
        public double StartReading { get; set; }
        public double EndReading { get; set; }
        public DateTime CurrentDate { get; set; }

        public string CreatedByUserId { get; set; }
        public AppUser CreatedByUser { get; set; }

        public ICollection<VehicleTravelFormAttachment> Attachments { get; set; } = new List<VehicleTravelFormAttachment>();
    }
}
