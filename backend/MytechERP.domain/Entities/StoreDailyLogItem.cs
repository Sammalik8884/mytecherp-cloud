using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities
{
    public class StoreDailyLogItem
    {
        public int Id { get; set; }
        
        public int StoreDailyLogId { get; set; }
        public StoreDailyLog StoreDailyLog { get; set; } = null!;

        public int StoreToolId { get; set; }
        public StoreTool StoreTool { get; set; } = null!;

        public string? CustomDescription { get; set; }
        
        public int QuantityOut { get; set; }
        public int? QuantityIn { get; set; }
    }
}
