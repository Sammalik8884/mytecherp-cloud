using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MytechERP.domain.Entities.CRM;

namespace MytechERP.domain.Entities
{
    public class AppUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public int TenantId { get; set; }
        public bool IsActive { get; set; } = true;
        public int? CustomerId{ get; set; }
        public Customer? Customer { get; set; }
    }
}
