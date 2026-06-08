using System;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class TrainingDetailParticipant : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }

        public int TrainingDetailId { get; set; }
        public TrainingDetail? TrainingDetail { get; set; }

        public string ParticipantName { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string ContactDetails { get; set; } = string.Empty;
        public string EmployeeStatus { get; set; } = string.Empty; // Present, Absent, Excused

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
    }
}
