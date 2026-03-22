using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class UpdateChecklistDto
    {
        public int ResultId { get; set; } 
        public string SelectedValue { get; set; } = string.Empty;
        public string? Comments { get; set; } 
    }
}
