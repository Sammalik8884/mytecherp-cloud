using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateContractItemDto
    {
        [Required]
        public int ContractId { get; set; }

        [Required]
        public int AssetId { get; set; }

        public decimal Price { get; set; } 
        public int VisitsPerYear { get; set; } = 4;
    }
}
