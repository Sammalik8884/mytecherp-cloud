using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MytechERP.domain.Entities;

namespace MytechERP.Application.Interfaces
{
    public interface ICurrentUserService
    {
         string?  UserId { get; }
        int? TenantId { get; }
        string? Role { get; }
        Task<Tenant?> GetCurrentTenantAsync();
    }
}
