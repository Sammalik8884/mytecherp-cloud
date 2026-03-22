using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Enums;
using MytechERP.domain.Interfaces; // Added namespace for ISyncableEntity
using System.ComponentModel.DataAnnotations;

namespace MytechERP.domain.Entities.CRM
{
    public class Asset : BaseEntity, ISyncableEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty; 

        [Required]
        public string SerialNumber { get; set; } = string.Empty;

        [Required]
        public AssetType AssetType { get; set; }
        public AssetStatus Status { get; set; } = AssetStatus.Active;

        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public DateTime ManufacturingDate { get; set; }
        public DateTime ExpiryDate { get; set; } 

        public string LocationDescription { get; set; } = string.Empty; 

        
        public int SiteId { get; set; }
        public Site? Site { get; set; }
        public string? Floor { get; set; } 
        public string? Room { get; set; }
        public int CategoryId { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public string? FlexibleData { get; set; }
    }
}