using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.CRM
{
    public class CreateUserRequest  
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public string? Designation { get; set; }
        public int? SiteId { get; set; }
        public string? Region { get; set; }
        public decimal? CustomArfLimit { get; set; }
    }
}
