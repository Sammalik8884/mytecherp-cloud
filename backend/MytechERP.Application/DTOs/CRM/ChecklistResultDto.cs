using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class ChecklistResultDto
    {
        public int Id { get; set; } 
        public string QuestionText { get; set; } = string.Empty;
        public string InputType { get; set; } = string.Empty; 
        public List<string> Options { get; set; } = new List<string>();
        public string? SelectedValue { get; set; } 
        public bool IsPass { get; set; }
    }
}
