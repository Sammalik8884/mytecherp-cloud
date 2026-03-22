using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using System.Security.Claims;

namespace MyTechERP.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IServiceScopeFactory _scopeFactory;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor, IServiceScopeFactory scopeFactory)
        {
            _httpContextAccessor = httpContextAccessor;
            _scopeFactory = scopeFactory;
        }

        public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

        public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);

        public int? TenantId
        {
            get
            {
                var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId")?.Value;
                if (!string.IsNullOrEmpty(claim) && int.TryParse(claim, out int result))
                {
                    return result;
                }
                return null;
            }
        }

        public async Task<Tenant?> GetCurrentTenantAsync()
        {
            if (TenantId == null) return null;
            // Use a new scope to avoid circular dependency with DbContext
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            return await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == TenantId.Value);
        }
    }
}