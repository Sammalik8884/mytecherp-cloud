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
    public class Vendor : BaseEntity, ISyncableEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty; 

        public string ContactPerson { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public string PaymentTerms { get; set; } = "Net 30";

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
    }
}
