using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using MytechERP.Application.Interfaces;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Persistence
{
    public class DummyCurrentUserService : ICurrentUserService
    {
        public string UserId => "Migration-User";
        public int TenantId => 1;
        public string? Role => null;
        int? ICurrentUserService.TenantId => TenantId;
        public Task<MytechERP.domain.Entities.Tenant?> GetCurrentTenantAsync()
            => Task.FromResult<MytechERP.domain.Entities.Tenant?>(null);
    }

    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

            optionsBuilder.UseSqlServer("Server=localhost\\SQLEXPRESS;Database=MyTechERP_DB;Trusted_Connection=True;TrustServerCertificate=True;");

            var dummyUserService = new DummyCurrentUserService();

            return new ApplicationDbContext(optionsBuilder.Options, dummyUserService);
        }
    }
}
