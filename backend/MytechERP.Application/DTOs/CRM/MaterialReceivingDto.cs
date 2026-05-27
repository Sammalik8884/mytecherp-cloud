using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class MaterialReceivingItemDto
    {
        public int Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string LocationValue { get; set; } = string.Empty;
        public string Received { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }

    public class MaterialReceivingFormDto
    {
        public int Id { get; set; }
        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public List<MaterialReceivingItemDto> Items { get; set; } = new List<MaterialReceivingItemDto>();
    }

    public class CreateMaterialReceivingFormDto
    {
        public int? SiteId { get; set; }
        public string? Location { get; set; }
        public List<CreateMaterialReceivingItemDto> Items { get; set; } = new List<CreateMaterialReceivingItemDto>();
    }

    public class CreateMaterialReceivingItemDto
    {
        public string ItemName { get; set; } = string.Empty;
        public string LocationValue { get; set; } = string.Empty;
        public string Received { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }
}
