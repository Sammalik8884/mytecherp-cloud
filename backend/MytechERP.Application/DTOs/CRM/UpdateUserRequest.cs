using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class UpdateUserRequest
    {
        public string FullName { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public string? Designation { get; set; }
        public int? SiteId { get; set; }
        public string? Region { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
