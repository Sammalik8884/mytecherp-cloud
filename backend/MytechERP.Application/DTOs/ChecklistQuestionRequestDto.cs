using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs
{
    public class ChecklistQuestionRequestDto
    {
        public string Text { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string Type { get; set; } = "Boolean"; 
        public string StandardRef { get; set; } = string.Empty; 
        public List<string> Options { get; set; } = new();
    }
}
