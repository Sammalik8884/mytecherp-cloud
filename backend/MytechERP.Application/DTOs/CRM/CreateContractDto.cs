using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateContractDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty; // From frontend
        
        [Required] public DateTime StartDate { get; set; }
        [Required] public DateTime EndDate { get; set; }

        [Range(1, 12)]
        public int VisitFrequencyMonths { get; set; } 

        public decimal ContractValue { get; set; } 
        public decimal Value { get; set; } // From frontend

        [Required] public int CustomerId { get; set; }
    }
}
