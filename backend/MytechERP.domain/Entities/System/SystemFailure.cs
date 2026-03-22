using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.System
{
    public class SystemFailure : BaseEntity
    {
        [Required]
        public string JobName { get; set; } = string.Empty; 

        public string Payload { get; set; } = string.Empty; 
        public string ErrorMessage { get; set; } = string.Empty;

        public string StackTrace { get; set; } = string.Empty;

        public int RetryCount { get; set; }

        public DateTime FailedAt { get; set; } = DateTime.UtcNow;
    }
}

