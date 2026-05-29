using MytechERP.domain.Interfaces;
using System;

namespace MytechERP.domain.Entities.CRM
{
    public class DprAttachment : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int DailyProgressReportId { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public string BlobName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }

        public DailyProgressReport DailyProgressReport { get; set; }
    }
}