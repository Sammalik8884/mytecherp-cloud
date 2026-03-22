using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Inventory
{
    public class StockTransfer : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public string TransferNumber { get; set; } = string.Empty; 

        public int FromWarehouseId { get; set; }
        public Warehouse? FromWarehouse { get; set; }

        public int ToWarehouseId { get; set; }
        public Warehouse? ToWarehouse { get; set; }

        public DateTime TransferDate { get; set; } = DateTime.UtcNow;
        public string Notes { get; set; } = string.Empty;

        public TransferStatus Status { get; set; } = TransferStatus.Draft;

        public virtual ICollection<StockTransferItem> Items { get; set; } = new List<StockTransferItem>();
        public enum TransferStatus
        {
            Draft = 0,
            Completed = 1,
            Cancelled = 2

        }    }
}
