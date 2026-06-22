using System;
using System.ComponentModel.DataAnnotations.Schema;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities
{
    public class StoreDailyLogItem : ISyncableEntity
    {
        public int Id { get; set; }
        
        public int StoreDailyLogId { get; set; }
        public StoreDailyLog StoreDailyLog { get; set; } = null!;

        public int StoreToolId { get; set; }
        public StoreTool StoreTool { get; set; } = null!;

        public string? CustomDescription { get; set; }
        
        public int QuantityOut { get; set; }
        public int? QuantityIn { get; set; }

        public int TenantId { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
    }
}
