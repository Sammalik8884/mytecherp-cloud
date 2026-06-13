using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.CRM
{
    public class Office : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        [Column("OfficeName")]
        public string Name { get; set; } = string.Empty;
        
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }
}
