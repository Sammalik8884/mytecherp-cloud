using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class TrainingDetailDto
    {
        public int Id { get; set; }
        public string TrainerName { get; set; } = string.Empty;
        public string FromTime { get; set; } = string.Empty;
        public string ToTime { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Location { get; set; } = string.Empty;
        public string TrainingType { get; set; } = string.Empty;
        public ICollection<TrainingDetailParticipantDto> Participants { get; set; } = new List<TrainingDetailParticipantDto>();
    }

    public class TrainingDetailParticipantDto
    {
        public int Id { get; set; }
        public int TrainingDetailId { get; set; }
        public string ParticipantName { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string ContactDetails { get; set; } = string.Empty;
        public string EmployeeStatus { get; set; } = string.Empty;
    }
}
