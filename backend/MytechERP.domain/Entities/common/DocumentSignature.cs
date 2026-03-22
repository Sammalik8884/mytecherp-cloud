using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.common
{
    public class DocumentSignature : BaseEntity
    {
        [Required]
        public string EntityName { get; set; } = string.Empty;

        [Required]
        public int EntityId { get; set; }

        [Required]
        public string Signature { get; set; } = string.Empty; 

        [Required]
        public string KeyVersion { get; set; } = string.Empty; 

        [Required]
        public string DataHash { get; set; } = string.Empty; 

        [Required]
        public string SignedByUserId { get; set; } = string.Empty;

        public DateTime SignedAt { get; set; } = DateTime.UtcNow;
    }
}
    
