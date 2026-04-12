using MytechERP.domain.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using MytechERP.domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities
{
    public class Product : ISyncableEntity
    {
        // --- EXISTING ---
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int TenantId { get; set; }
        public int CategoryId { get; set; }
        public string? ImageUrl { get; set; } 
        public Category? Category { get; set; }

        public string? Description { get; set; }
        public string? Brand { get; set; }
        public string? ItemCode { get; set; }
        public string? SupplierItemCode { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; } = 0;

        public int ReorderLevel { get; set; } = 5;
        [Column(TypeName = "decimal(18,2)")]
        public decimal? PriceAED { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? TechnicalSpecs { get; set; }

        public ProductType Type { get; set; } = ProductType.Local;
    }
}