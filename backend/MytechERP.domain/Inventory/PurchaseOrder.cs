using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Inventory
{
    public class PurchaseOrder : BaseEntity, ISyncableEntity
    {
        public string PONumber { get; set; } = string.Empty; 
        public int VendorId { get; set; }
        public Vendor? Vendor { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDeliveryDate { get; set; }

        public POStatus Status { get; set; } = POStatus.Draft;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public int TargetWarehouseId { get; set; }
        public Warehouse? TargetWarehouse { get; set; }

        public virtual ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
        public enum POStatus
        {
            Draft = 0,
            Sent = 1,
            PartiallyReceived = 2,
            Received = 3,
            Cancelled = 4
        }
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
    }
}
