using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.System
{
    /// <summary>
    /// Tenant-level configuration for imported item price calculations.
    /// These defaults are applied automatically when creating quotations.
    /// </summary>
    public class QuotationSettings : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        /// <summary>Exchange rate from USD to PKR (default 300)</summary>
        [Column(TypeName = "decimal(18,4)")]
        public decimal DefaultExchangeRate { get; set; } = 300m;

        /// <summary>Cost factor / negotiated cost percentage (default 60%)</summary>
        [Column(TypeName = "decimal(18,4)")]
        public decimal CostFactorPct { get; set; } = 60m;

        /// <summary>Importation charges percentage (default 13.75% = 55% × 25%)</summary>
        [Column(TypeName = "decimal(18,4)")]
        public decimal ImportationPct { get; set; } = 13.75m;

        /// <summary>Transportation percentage (default 2%)</summary>
        [Column(TypeName = "decimal(18,4)")]
        public decimal TransportationPct { get; set; } = 2m;

        /// <summary>Profit margin percentage (default 15%)</summary>
        [Column(TypeName = "decimal(18,4)")]
        public decimal ProfitPct { get; set; } = 15m;
    }
}
