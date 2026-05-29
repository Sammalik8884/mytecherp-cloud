using System;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class ItemProcurementItem : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int ItemProcurementId { get; set; }
        public string ItemName { get; set; }
        public int Quantity { get; set; }
        public string Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }

        public ItemProcurement ItemProcurement { get; set; }
    }
}
