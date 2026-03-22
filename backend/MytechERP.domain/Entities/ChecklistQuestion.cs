using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities
{
    public class ChecklistQuestion
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        public string ConfigJson { get; set; } = string.Empty;
        public string Version { get; set; } = "1.0";
        public bool IsActive { get; set; } = true;
    }
}
