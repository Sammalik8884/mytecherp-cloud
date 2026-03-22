using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs
{
    public class ChecklistQuestionResponseDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string ConfigJson { get; set; } = string.Empty;
        public string Version { get; set; } = "1.0";
    }

}
