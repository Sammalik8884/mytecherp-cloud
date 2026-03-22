using MytechERP.Application.DTOs;
using MytechERP.Application.DTOs.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<string> CreateUserAsync(CreateUserRequest request, string currentAdminTenantId);
        Task<AuthResponse> LoginStepTwoAsync(string tempToken, int tenantId);
        Task<string> GeneratePasswordResetTokenAsync(string email);
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
        Task<IEnumerable<object>> GetUsersByTenantAsync(int tenantId);
        Task<IEnumerable<string>> GetRolesAsync();
    }
}
