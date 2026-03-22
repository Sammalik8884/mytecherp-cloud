using MytechERP.domain.Common;
using MytechERP.domain.Entities;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Inventory
{
    public class InventoryStock : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        public int WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }
        public int QuantityOnHand { get; set; } = 0;
        public string BinLocation { get; set; } = string.Empty;
    }
}
