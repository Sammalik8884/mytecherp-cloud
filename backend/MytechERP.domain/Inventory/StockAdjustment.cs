using MytechERP.domain.Common;
using MytechERP.domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Inventory
{
    public class StockAdjustment : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public string AdjustmentNumber { get; set; } = string.Empty; 

        public int WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        public int QuantityAdjusted { get; set; }

        [Required]
        public string Reason { get; set; } = string.Empty; 

        public DateTime AdjustmentDate { get; set; } = DateTime.UtcNow;
    }
}
