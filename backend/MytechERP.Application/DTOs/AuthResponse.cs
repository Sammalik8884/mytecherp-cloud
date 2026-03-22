using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs
{
   public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public List<string> Roles { get; set; }
        public int PlanFeatures { get; set; }
        
        // Multi-Tenant Step 2 Support
        public bool RequiresTenantSelection { get; set; }
        public string TempToken { get; set; }
        public List<TenantInfo> Tenants { get; set; }
    }

    public class TenantInfo
    {
        public int TenantId { get; set; }
        public string CompanyName { get; set; }
        public string UserId { get; set; }
    }
}
