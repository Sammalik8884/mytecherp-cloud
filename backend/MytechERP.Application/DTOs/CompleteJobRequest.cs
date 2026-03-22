using MytechERP.domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs
{
    public class CompleteJobRequest
    {
        public string Notes { get; set; } = string.Empty;
        public InspectionResult Result { get; set; }
    }
}
