using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MytechERP.Application.DTOs;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager; 
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ISubscriptionService _subscriptionService;

        public AuthService(
             UserManager<AppUser> userManager,
             RoleManager<IdentityRole> roleManager,
             ApplicationDbContext context,
             IConfiguration configuration,
             ISubscriptionService subscriptionService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _configuration = configuration;
            _subscriptionService = subscriptionService;
        }

       
        public async Task<string> RegisterAsync(RegisterRequest request)
        {
            var newTenant = new Tenant
            {
                CompanyName = request.CompanyName,
                SubscriptionPlan = "Trial",
                CreatedAt = DateTime.UtcNow,
                TrialStartedAt = DateTime.UtcNow,
                SubscriptionExpiresAt = DateTime.UtcNow.AddDays(14),
                IsActive = true
            };
            _context.Tenants.Add(newTenant);
            await _context.SaveChangesAsync();
            await _context.Entry(newTenant).ReloadAsync();

            if (newTenant.Id == 0) throw new Exception("DB failed to generate ID");

            var user = new AppUser
            {
                UserName = $"{request.Email}_{newTenant.Id}",
                Email = request.Email,
                FullName = request.FullName,
                TenantId = newTenant.Id, 
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {

                await EnsureRolesExist();
                await _userManager.AddToRoleAsync(user, "Admin");

                return "Company registered successfully! You are the Admin.";
            }
            else
            {
                var errors = string.Join(",", result.Errors.Select(e => e.Description));
                throw new Exception(errors);
            }
        }

       
        public async Task<string> CreateUserAsync(CreateUserRequest request, string currentAdminTenantId)
        {
            int tenantId = int.Parse(currentAdminTenantId);

            // ── Step 1: Enforce MaxUsers limit ────────────────────────────────────────
            // Count existing users for this tenant.
            var currentUserCount = await _userManager.Users
                .CountAsync(u => u.TenantId == tenantId);

            // Resolve the plan's MaxUsers. Default to 5 (trial limit) when no paid subscription exists.
            int maxUsers = 5;
            var tenantSubscription = await _context.TenantSubscriptions
                .AsNoTracking()
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.TenantId == tenantId
                    && s.SubscriptionStatus == MytechERP.domain.Enums.SubscriptionStatus.Active);

            if (tenantSubscription?.Plan != null)
            {
                maxUsers = tenantSubscription.Plan.MaxUsers;
            }

            if (currentUserCount >= maxUsers)
            {
                throw new Exception(
                    $"User limit reached for your current plan ({maxUsers} users allowed). " +
                    "Please upgrade your subscription to add more users.");
            }

            // ── Step 2: Customer account validation ───────────────────────────────────
            // If creating a Customer account, verify there is a matching Customer record in CRM
            if (request.Role == "Customer")
            {
                var customerRecord = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Email.ToLower() == request.Email.ToLower() && c.TenantId == tenantId);

                if (customerRecord == null)
                    throw new Exception(
                        $"No CRM customer found with email '{request.Email}'. " +
                        "Please add the customer in the Customers module first, then create their portal account.");
            }

            var newUser = new AppUser
            {
                UserName = $"{request.Email}_{tenantId}",
                Email = request.Email,
                FullName = request.FullName,
                TenantId = tenantId,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(newUser, request.Password);

            if (!result.Succeeded)
            {
                throw new Exception(string.Join(",", result.Errors.Select(e => e.Description)));
            }

            await EnsureRolesExist();
            string roleToAssign = (await _roleManager.RoleExistsAsync(request.Role)) ? request.Role : "Technician";
            await _userManager.AddToRoleAsync(newUser, roleToAssign);

            return $"User created successfully as {roleToAssign}";
        }


        
        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var validUsers = new List<AppUser>();
            var allUsersWithEmail = await _context.Users.Where(u => u.Email == request.Email).ToListAsync();
            
            foreach (var u in allUsersWithEmail)
            {
                if (await _userManager.CheckPasswordAsync(u, request.Password))
                {
                    validUsers.Add(u);
                }
            }

            if (validUsers.Count == 0)
            {
                Console.WriteLine($"[AUTH DEBUG] User not found or incorrect password for email: {request.Email}");
                throw new Exception("Invalid Credentials");
            }

            if (validUsers.Count > 1)
            {
                // Multi-tenant case -> Step 1 returns requires selection
                var authClaims = new List<Claim> { new Claim(ClaimTypes.Email, request.Email) };
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]));
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(authClaims),
                    Expires = DateTime.UtcNow.AddMinutes(15), 
                    SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _configuration["JwtSettings:Issuer"],
                    Audience = _configuration["JwtSettings:Audience"]
                };
                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.CreateToken(tokenDescriptor);

                var tenantIds = validUsers.Select(u => u.TenantId).ToList();
                var tenantsDict = await _context.Tenants.Where(t => tenantIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, t => t.CompanyName);

                return new AuthResponse
                {
                    RequiresTenantSelection = true,
                    TempToken = tokenHandler.WriteToken(token),
                    Tenants = validUsers.Select(u => new TenantInfo
                    {
                        TenantId = u.TenantId,
                        CompanyName = tenantsDict.ContainsKey(u.TenantId) ? tenantsDict[u.TenantId] : "Unknown Workspace",
                        UserId = u.Id
                    }).ToList()
                };
            }

            // Exactly 1 user matches -> Generate token straight away
            return await GenerateAuthResponse(validUsers.First());
        }

        public async Task<AuthResponse> LoginStepTwoAsync(string tempToken, int tenantId)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]);
            
            try
            {
                tokenHandler.ValidateToken(tempToken, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["JwtSettings:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var emailClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Email || x.Type == "email");
                if (emailClaim == null) throw new Exception("Token does not contain an email claim.");
                var email = emailClaim.Value;

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.TenantId == tenantId);
                if (user == null) throw new Exception($"Invalid tenant selection. User not found for email {email} in tenant {tenantId}.");

                return await GenerateAuthResponse(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH DEBUG] Token validation failed: {ex.GetType().Name} - {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw new Exception($"Temporary token validation failed: {ex.Message}");
            }
        }

        private async Task<AuthResponse> GenerateAuthResponse(AppUser user)
        {
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim("TenantId", user.TenantId.ToString()),
                new Claim("FullName", user.FullName ?? "")
            };

            var userRoles = await _userManager.GetRolesAsync(user);
            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]));
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(authClaims),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["JwtSettings:DurationInMinutes"])),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["JwtSettings:Issuer"],
                Audience = _configuration["JwtSettings:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            int planFeaturesVal = 0;
            if (user.TenantId > 0)
            {
                var planFeatures = await _subscriptionService.GetPlanFeaturesAsync(user.TenantId);
                planFeaturesVal = (int)planFeatures;
            }

            return new AuthResponse
            {
                Token = tokenHandler.WriteToken(token),
                Email = user.Email,
                FullName = user.FullName,
                Roles = userRoles.ToList(),
                PlanFeatures = planFeaturesVal
            };
        }

        public async Task<string> GeneratePasswordResetTokenAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return string.Empty;
            return await _userManager.GeneratePasswordResetTokenAsync(user);
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
        {
            // Reset for ALL accounts sharing this email (multi-tenant)
            var users = await _context.Users.Where(u => u.Email == dto.Email).ToListAsync();
            if(!users.Any()) return false;
            
            bool anySuccess = false;
            foreach(var user in users)
            {
                var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
                if(result.Succeeded) anySuccess = true;
            }
            return anySuccess;
        }
        
        private async Task EnsureRolesExist()
        {
            string[] roleNames = { "Admin", "Manager", "Engineer", "Technician", "Customer" };

            foreach (var roleName in roleNames)
            {
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    await _roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }
        }

        public async Task<IEnumerable<object>> GetUsersByTenantAsync(int tenantId)
        {
            var users = await _userManager.Users
                .Where(u => u.TenantId == tenantId)
                .ToListAsync();

            var result = new List<object>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    Roles = roles,
                    user.IsActive
                });
            }

            return result;
        }

        public async Task<IEnumerable<string>> GetRolesAsync()
        {
            await EnsureRolesExist();
            var roles = await _roleManager.Roles.Select(r => r.Name).ToListAsync();
            return roles;
        }
    }
}