using MytechERP.domain.Common;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.domain.Entities.Finance
{
    public class BankAccount : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        [Required]
        [MaxLength(200)]
        public string BankName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string AccountTitle { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;
        
    }
}
