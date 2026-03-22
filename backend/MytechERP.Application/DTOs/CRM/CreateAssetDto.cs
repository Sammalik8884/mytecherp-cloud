using MytechERP.domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateAssetDto
    {
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string SerialNumber { get; set; } = string.Empty;

        public int CategoryId { get; set; }
        [Required] public AssetType AssetType { get; set; }

        public AssetStatus Status { get; set; } = AssetStatus.Active; 

        public string Location { get; set; } = string.Empty;
        public string? Floor { get; set; }
        public string? Room { get; set; }  

        [Required] public int SiteId { get; set; }

        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public DateTime ManufacturingDate { get; set; }
    }
}
