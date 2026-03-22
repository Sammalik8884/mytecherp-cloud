using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.Inventory
{
    public class CreateTransferDto
    {
        public int FromWarehouseId { get; set; }
        public int ToWarehouseId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public List<TransferItemDto> Items { get; set; } = new();
    }
}
