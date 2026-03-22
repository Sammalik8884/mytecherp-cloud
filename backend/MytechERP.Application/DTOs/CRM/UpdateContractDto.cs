using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class UpdateContractDto
    {
        [Required] public int Id { get; set; } 
        [Required] public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int VisitFrequencyMonths { get; set; }
        public decimal ContractValue { get; set; }
        public bool IsActive { get; set; }
    }
}
