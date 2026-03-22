using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.System
{
    public class TimeLog : BaseEntity
    {
        public int WorkOrderId { get; set; }
        public string TechnicianId { get; set; } = string.Empty;

        public DateTime CheckInTime { get; set; }
        public double? CheckInLatitude { get; set; }
        public double? CheckInLongitude { get; set; }

        public DateTime? CheckOutTime { get; set; }
        public double? CheckOutLatitude { get; set; }
        public double? CheckOutLongitude { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal HourlyRate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost { get; set; }

        public string? Notes { get; set; }

        public double GetTotalHours()
        {
            if (!CheckOutTime.HasValue) return 0;
            return (CheckOutTime.Value - CheckInTime).TotalHours;
        }
    }
}
