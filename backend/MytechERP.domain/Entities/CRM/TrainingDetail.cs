using System;
using System.Collections.Generic;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class TrainingDetail : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string TrainerName { get; set; } = string.Empty;
        public string FromTime { get; set; } = string.Empty;
        public string ToTime { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Location { get; set; } = string.Empty;
        public string TrainingType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public ICollection<TrainingDetailParticipant> Participants { get; set; }

        public TrainingDetail()
        {
            Participants = new List<TrainingDetailParticipant>();
        }
    }
}
