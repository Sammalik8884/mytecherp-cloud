using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CustomerDto
    {
        public int Id { get; set; }
        public string Name { get; set; }=string.Empty;
        public string Email { get; set; }= string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsProspect { get; set; }
        public string? ContactPersonName { get; set; }
        public bool HasVisitingCard { get; set; }
        public string? ContractorCompanyName { get; set; }
        public string? FurtherDetails { get; set; }

    }
}
