using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateSiteDto
    {
        [Required]
        public string Name { get; set; }=string.Empty;
        [Required]
        public string Address { get; set; }= string.Empty;
        public string City {  get; set; }=string.Empty;
        [Required]
        public int CustomerId {  get; set; }
    }
}
