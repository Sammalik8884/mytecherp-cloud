using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.CRM
{
    public class ContractItem : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public int ContractId { get; set; }
        public Contract Contract { get; set; }
        public int AssetId { get; set; }
        public Asset Asset { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
        public int ServiceVisitsPerYear { get; set; } = 4;
    }
}
