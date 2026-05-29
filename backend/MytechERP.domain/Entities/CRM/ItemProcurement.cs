using System;
using System.Collections.Generic;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class ItemProcurement : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int SiteId { get; set; }
        public DateTime Date { get; set; }
        public string Remarks { get; set; }

        public string CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }

        public Site Site { get; set; }
        public AppUser CreatedByUser { get; set; }

        public ICollection<ItemProcurementItem> Items { get; set; }

        public ItemProcurement()
        {
            Items = new List<ItemProcurementItem>();
        }
    }
}
