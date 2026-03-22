using Microsoft.VisualBasic;
using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.Job
{
    public class JobEvidence : BaseEntity
    {
       
        public int WorkOrderId { get; set; }
        public string FileType { get; set; } = string.Empty; 
        public string FileUrl { get; set; } = string.Empty;
        public double GpsLatitude { get; set; }
        public double GpsLongitude { get; set; }

        public DateTime Timestamp { get; set; }
        [Required]
        public string ContentHash { get; set; } = string.Empty; 

        [Required]
        public string TechnicianId { get; set; } = string.Empty; 

        public string FileName { get; set; } = string.Empty; 
    }
}