using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities
{
    public class StoreTool
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public int TotalQuantity { get; set; }
        public int CurrentQuantity { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
