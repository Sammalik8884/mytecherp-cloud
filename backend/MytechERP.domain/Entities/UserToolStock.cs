using System;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities
{
    /// <summary>
    /// Tracks how many of a given StoreTool are available in a specific User's personal inventory.
    /// </summary>
    public class UserToolStock : ISyncableEntity
    {
        public int Id { get; set; }
        
        public string UserId { get; set; } = string.Empty;
        public AppUser User { get; set; } = null!;
        
        public int StoreToolId { get; set; }
        public StoreTool StoreTool { get; set; } = null!;
        
        /// <summary>Current stock available in this user's inventory for this tool.</summary>
        public int AvailableQuantity { get; set; } = 0;

        public int TenantId { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
