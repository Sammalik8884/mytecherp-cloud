using System;
using MytechERP.domain.Entities.CRM;

namespace MytechERP.domain.Entities
{
    /// <summary>
    /// Tracks how many of a given StoreTool are available at a specific Site.
    /// This replaces the global StoreTool.CurrentQuantity for checkout/checkin purposes.
    /// </summary>
    public class SiteToolStock
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public Site Site { get; set; } = null!;
        public int StoreToolId { get; set; }
        public StoreTool StoreTool { get; set; } = null!;
        /// <summary>Current stock available at this site for this tool.</summary>
        public int AvailableQuantity { get; set; } = 0;
    }
}
