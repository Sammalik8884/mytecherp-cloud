using Microsoft.AspNetCore.Authorization; // 👈 Required for [Authorize]
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Roles;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IEmailService _emailService;

        public AuthController(IAuthService authService, ICurrentUserService currentUserService, IEmailService emailService)
        {
            _authService = authService;
            _currentUserService = currentUserService;
            _emailService = emailService;
        }

       
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var result = await _authService.RegisterAsync(request);
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                var errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest(new { error = errorMsg });
            }
        }

        
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
        }

        [HttpPost("login-step-two")]
        public async Task<IActionResult> LoginStepTwo([FromBody] LoginStepTwoRequest request)
        {
            try
            {
                var result = await _authService.LoginStepTwoAsync(request.TempToken, request.TenantId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
        }

       
        [HttpPost("create-user")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)] 
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            try
            {
               
                var tenantIdClaim = User.Claims.FirstOrDefault(c => c.Type == "TenantId");

                if (tenantIdClaim == null)
                    return Unauthorized(new { error = "Security Token is missing Tenant ID." });

                
                var result = await _authService.CreateUserAsync(request, tenantIdClaim.Value);

                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

       
        [HttpGet("me")]
        [Authorize]
        public IActionResult GetCurrentUser()
        {
            return Ok(new
            {
                Message = "I know who you are",
                UserId = _currentUserService.UserId,
                TenantId = _currentUserService.TenantId,
                Roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value)
            });
        }
        [HttpGet("debug-token")]
        [Authorize]
        public IActionResult DebugToken()
        {
            return Ok(User.Claims.Select(c => new { Type = c.Type, Value = c.Value }));
        }

        [HttpGet("users")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> GetUsers()
        {
            var tenantIdClaim = User.Claims.FirstOrDefault(c => c.Type == "TenantId");
            if (tenantIdClaim == null || !int.TryParse(tenantIdClaim.Value, out int tenantId))
                return Unauthorized(new { error = "Security Token is missing a valid Tenant ID." });

            var users = await _authService.GetUsersByTenantAsync(tenantId);
            return Ok(users);
        }

        [HttpGet("roles")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _authService.GetRolesAsync();
            return Ok(roles);
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var token = await _authService.GeneratePasswordResetTokenAsync(dto.Email);
            if (!string.IsNullOrEmpty(token))
            {
                var encodedToken = System.Web.HttpUtility.UrlEncode(token);
                var resetLink = $"https://mytech-erp.vercel.app/reset-password?email={System.Web.HttpUtility.UrlEncode(dto.Email)}&token={encodedToken}";
                
                var emailBody = $@"
                    <h2>Reset Your Password</h2>
                    <p>You requested a password reset. Click the button below to reset your password:</p>
                    <p><a href='{resetLink}' style='padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Password</a></p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>{resetLink}</p>
                    <br/>
                    <p>If you didn't request this, please ignore this email.</p>
                ";

                await _emailService.SendEmailAsync(dto.Email, "Password Reset Request", emailBody, true);
            }

            return Ok(new { message = "If that email exists, a reset link has been sent to your inbox." });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var success = await _authService.ResetPasswordAsync(dto);
            if (success)
            {
                return Ok(new { message = "Password has been successfully reset." });
            }
            
            return BadRequest(new { error = "Invalid token or email." });
        }
    }

    public class LoginStepTwoRequest
    {
        public string TempToken { get; set; }
        public int TenantId { get; set; }
    }
}