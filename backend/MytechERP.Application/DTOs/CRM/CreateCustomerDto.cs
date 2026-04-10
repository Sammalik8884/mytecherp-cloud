using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateCustomerDto
    {
        [Required]
        public string Name { get; set; }=string.Empty;
        [EmailAddress]
        public string Email { get; set; }= string.Empty;
        public string Phone {  get; set; }= string.Empty;
        public string Address {  get; set; }= string.Empty;
        public string TaxNumber { get; set; } = string.Empty;
        public bool IsProspect { get; set; } = false;


    }
}
