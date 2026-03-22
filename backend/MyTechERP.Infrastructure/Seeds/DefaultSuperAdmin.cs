using Microsoft.AspNetCore.Identity;
using MytechERP.domain.Entities;
using MytechERP.domain.Roles;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Seeds
{
    public static class DefaultSuperAdmin
    {
        public static async Task SeedAsync(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager)
        {
           var defaultUser = new AppUser
           {
               UserName="admin@mytecherp.com",
               Email="admin@mytecherp.com",
               FullName= "Super Admin",
               EmailConfirmed= true,
               PhoneNumberConfirmed= true,
               IsActive=true,
               TenantId=1
           };
            if (userManager.Users.All(u => u.Id != defaultUser.Id))
            {
                var user= await userManager.FindByEmailAsync(defaultUser.Email);
                if (user == null)
                { 
                await userManager.CreateAsync(defaultUser,"Password@123");
                    await userManager.AddToRoleAsync(defaultUser, Roles.Admin);
                
                }
            }
        }
    }


}
