using MytechERP.domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class UpdateAssetDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public AssetType AssetType { get; set; }
        public AssetStatus Status { get; set; }
        public string Location { get; set; } = string.Empty;
        public string? Floor { get; set; }
        public string? Room { get; set; }
        public string Brand { get; set; } = string.Empty;
        public int SiteId { get; set; }
        public int CategoryId { get; set; }
    }
}
