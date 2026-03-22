using System;

namespace MytechERP.domain.Entities.System
{
    public class SyncConflict
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public int ServerId { get; set; }
        public string LocalMobileId { get; set; } = string.Empty;
        public string ServerPayloadJson { get; set; } = string.Empty;
        public string ClientPayloadJson { get; set; } = string.Empty;
        public string ResolutionStrategy { get; set; } = "ServerWins"; // e.g., ServerWins, ClientWins, Manual
        public bool IsResolved { get; set; } = true;
        public DateTime ConflictTime { get; set; } = DateTime.UtcNow;
    }
}
