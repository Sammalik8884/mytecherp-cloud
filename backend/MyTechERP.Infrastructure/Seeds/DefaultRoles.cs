using Microsoft.AspNetCore.Identity;
using MytechERP.domain.Constants;
using MytechERP.domain.Entities;
using MytechERP.domain.Roles;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Seeds
{
    public static class DefaultRoles
    {
        public static async Task SeedAsync(UserManager<AppUser> useramanager, RoleManager<IdentityRole> roleManager)
        {
            await roleManager.CreateAsync(new IdentityRole(Roles.Admin));
            await roleManager.CreateAsync(new IdentityRole(Roles.Manager));
            await roleManager.CreateAsync(new IdentityRole(Roles.Engineer));
            await roleManager.CreateAsync(new IdentityRole(Roles.Estimation));
            await roleManager.CreateAsync(new IdentityRole(Roles.Technician));
            await roleManager.CreateAsync(new IdentityRole(Roles.Customers));
            await roleManager.CreateAsync(new IdentityRole(Roles.Salesman));
            var adminRole = await roleManager.FindByNameAsync(Roles.Admin);
            await SeedClaimsForSuperAdmin(roleManager, adminRole);
        }
        private static async Task SeedClaimsForSuperAdmin(RoleManager<IdentityRole> roleManager, IdentityRole adminRole)
        {

            var existingClaims = await roleManager.GetClaimsAsync(adminRole);


            var allPermissions = new List<string>();


            var modules = typeof(Permissions).GetNestedTypes();
            foreach (var module in modules)
            {
                var fields = module.GetFields();
                foreach (var field in fields)
                {
                    var permissionValue = field.GetValue(null)?.ToString();
                    if (permissionValue != null)
                    {
                        allPermissions.Add(permissionValue);
                    }
                }
            }


            foreach (var permission in allPermissions)
            {
                if (!existingClaims.Any(c => c.Type == "Permission" && c.Value == permission))
                {
                    await roleManager.AddClaimAsync(adminRole, new Claim("Permission", permission));
                }
            }
        }
        }
}
