using System;
using System.ComponentModel.DataAnnotations.Schema;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities
{
    public class StoreTool : ISyncableEntity
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public int TotalQuantity { get; set; }
        public int CurrentQuantity { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int TenantId { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
    }
}
