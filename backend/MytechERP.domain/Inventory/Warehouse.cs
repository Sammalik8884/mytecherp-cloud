using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Inventory
{
    public class Warehouse : BaseEntity, ISyncableEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty; 

        public string Location { get; set; } = string.Empty;

        public bool IsMobile { get; set; } = false;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
    }
}
