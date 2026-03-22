using System;

namespace MytechERP.domain.Entities.System
{
    public class SyncLog
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int ItemsPushed { get; set; }
        public int ItemsPulled { get; set; }
        public int ConflictsResolved { get; set; }
        public int ErrorsEncountered { get; set; }
        public DateTime SyncTime { get; set; } = DateTime.UtcNow;
        public string DeviceInfo { get; set; } = string.Empty;
    }
}
