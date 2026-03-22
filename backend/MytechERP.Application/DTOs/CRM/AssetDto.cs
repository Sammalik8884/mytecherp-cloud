using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class AssetDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;

        public string AssetType { get; set; } = string.Empty;
        public int AssetTypeId { get; set; } 

        public string Status { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;
        public string Floor { get; set; } = string.Empty;
        public string Room { get; set; } = string.Empty;

        public string SiteName { get; set; } = string.Empty;

        public string Brand { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
    }
}
