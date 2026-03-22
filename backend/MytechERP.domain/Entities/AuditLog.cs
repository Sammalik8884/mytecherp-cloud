using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities
{
    public class AuditLog : BaseEntity
    {
        [Required]
        public string EntityName { get; set; } = string.Empty; 

        [Required]
        public int EntityId { get; set; }

        [Required]
        public string Action { get; set; } = string.Empty; 

        [Required]
        public string UserId { get; set; } = string.Empty; 

        public string? Details { get; set; } 

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }
}
