using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Inventory
{
    public class UpdatePODto
    {
        public int VendorId { get; set; }
        public int TargetWarehouseId { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public List<CreatePOItemDto> Items { get; set; } = new();
    }
}
