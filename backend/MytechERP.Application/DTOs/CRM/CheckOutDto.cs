using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CheckOutDto
    {
        public int WorkOrderId { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
