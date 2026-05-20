using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;

namespace MytechERP.domain.Entities.System
{
    public class TermsAndConditionsTemplate : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public string Name { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;

        public string? PaymentAndTax { get; set; }
        public string? Delivery { get; set; }
        public string? Warranty { get; set; }
        public string? PurchaseOrder { get; set; }
        public string? ValidityAndTransportation { get; set; }
        public string? General { get; set; }
    }
}
