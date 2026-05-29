using MytechERP.domain.Interfaces;
using System;

namespace MytechERP.domain.Entities.CRM
{
    public class DprMaterial : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int DailyProgressReportId { get; set; }
        public string Item { get; set; }
        public string Quantity { get; set; }
        public string Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }

        public DailyProgressReport DailyProgressReport { get; set; }
    }
}