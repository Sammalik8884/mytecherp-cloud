using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.Inventory
{
    public class CreatePODto
    {
        public int VendorId { get; set; }
        public int TargetWarehouseId { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public List<CreatePOItemDto> Items { get; set; } = new();
    }
}
