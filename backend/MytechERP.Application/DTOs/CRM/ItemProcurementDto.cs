using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class ItemProcurementDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public DateTime Date { get; set; }
        public string Remarks { get; set; }
        public string CreatedByUserName { get; set; }

        public List<ItemProcurementItemDto> Items { get; set; } = new List<ItemProcurementItemDto>();
    }

    public class CreateItemProcurementDto
    {
        public int SiteId { get; set; }
        public DateTime Date { get; set; }
        public string Remarks { get; set; }

        public List<CreateItemProcurementItemDto> Items { get; set; } = new List<CreateItemProcurementItemDto>();
    }

    public class CreateItemProcurementItemDto
    {
        public string ItemName { get; set; }
        public int Quantity { get; set; }
        public string Remarks { get; set; }
    }

    public class ItemProcurementItemDto : CreateItemProcurementItemDto
    {
        public int Id { get; set; }
    }
}
