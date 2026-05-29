using MytechERP.domain.Interfaces;
using System;

namespace MytechERP.domain.Entities.CRM
{
    public class DprEmployee : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int DailyProgressReportId { get; set; }
        public string EmployeeName { get; set; }
        public string InTime { get; set; }
        public string OutTime { get; set; }
        public string OverTime { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }

        public DailyProgressReport DailyProgressReport { get; set; }
    }
}