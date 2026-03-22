using MytechERP.domain.Common;
using MytechERP.domain.Entities;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Inventory
{
    public class PurchaseOrderItem : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public int PurchaseOrderId { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        public int QuantityOrdered { get; set; }
        public int QuantityReceived { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost => QuantityOrdered * UnitCost;
    }
}
