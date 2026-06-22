using System;

namespace MytechERP.Application.DTOs.Store
{
    public class StoreToolDto
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public int TotalQuantity { get; set; }
        public int CurrentQuantity { get; set; }
    }

    public class CreateStoreToolDto
    {
        public string Description { get; set; } = string.Empty;
        public int TotalQuantity { get; set; }
        public int? SiteId { get; set; }
    }
}
