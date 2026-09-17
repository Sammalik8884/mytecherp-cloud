using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.domain.Entities.Finance
{
    public class Cheque : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        [Required]
        [MaxLength(100)]
        public string ChequeNumber { get; set; } = string.Empty;

        public decimal InitialAmount { get; set; }

        public string PictureUrl { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public ICollection<AmountRequestPayment> Payments { get; set; } = new List<AmountRequestPayment>();
    }
}
