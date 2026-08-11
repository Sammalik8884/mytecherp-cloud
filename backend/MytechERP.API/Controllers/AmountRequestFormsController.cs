using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AmountRequestFormsController : ControllerBase
    {
        private readonly IAmountRequestFormService _service;

        public AmountRequestFormsController(IAmountRequestFormService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<List<AmountRequestFormDto>>> GetAll()
        {
            var forms = await _service.GetAllAsync();
            return Ok(forms);
        }

        [HttpGet("accounts/pending")]
        [Authorize]
        public async Task<ActionResult<List<AmountRequestFormDto>>> GetPendingForAccounts()
        {
            var reviewerEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();
            var allowedRoles = new[] { "CEO", "Admin", "Manager", "Accounts Head", "Accounts Assistant" };
            var allowedEmails = new[] { "asma@mytecheng.com", "munawar.hasan@mytecheng.com", "shahbaz.ali@mytecheng.com", "faisal.ghani@mytecheng.com", "abdul.majeed@mytecheng.com" };

            if (!roles.Any(r => allowedRoles.Contains(r)) && !allowedEmails.Contains(reviewerEmail, StringComparer.OrdinalIgnoreCase))
                return Forbid();

            var forms = await _service.GetPendingForAccountsAsync();
            return Ok(forms);
        }

        [HttpGet("accounts/history")]
        [Authorize]
        public async Task<ActionResult<List<AmountRequestFormDto>>> GetHistoryForAccounts()
        {
            var reviewerEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();
            var allowedRoles = new[] { "CEO", "Admin", "Manager", "Accounts Head", "Accounts Assistant" };
            var allowedEmails = new[] { "asma@mytecheng.com", "munawar.hasan@mytecheng.com", "shahbaz.ali@mytecheng.com", "faisal.ghani@mytecheng.com", "abdul.majeed@mytecheng.com" };

            if (!roles.Any(r => allowedRoles.Contains(r)) && !allowedEmails.Contains(reviewerEmail, StringComparer.OrdinalIgnoreCase))
                return Forbid();

            var forms = await _service.GetHistoryForAccountsAsync();
            return Ok(forms);
        }

        [HttpGet("accounts/partial")]
        [Authorize]
        public async Task<ActionResult<List<AmountRequestFormDto>>> GetPartialForAccounts()
        {
            var reviewerEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();
            var allowedRoles = new[] { "CEO", "Admin", "Manager", "Accounts Head", "Accounts Assistant" };
            var allowedEmails = new[] { "asma@mytecheng.com", "munawar.hasan@mytecheng.com", "shahbaz.ali@mytecheng.com", "faisal.ghani@mytecheng.com", "abdul.majeed@mytecheng.com" };

            if (!roles.Any(r => allowedRoles.Contains(r)) && !allowedEmails.Contains(reviewerEmail, StringComparer.OrdinalIgnoreCase))
                return Forbid();

            var forms = await _service.GetPartialForAccountsAsync();
            return Ok(forms);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AmountRequestFormDto>> GetById(int id)
        {
            try
            {
                var form = await _service.GetByIdAsync(id);
                return Ok(form);
            }
            catch (System.Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<ActionResult<AmountRequestFormDto>> Create([FromBody] CreateAmountRequestFormDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPost("{id}/approve")]
        public async Task<ActionResult<AmountRequestFormDto>> Approve(int id, [FromBody] ApproveAmountRequestDto dto)
        {
            try
            {
                var result = await _service.ApproveAsync(id, dto);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/release")]
        [Authorize]
        public async Task<ActionResult<AmountRequestFormDto>> ReleaseAmount(int id, [FromForm] AccountsReleaseAmountDto dto, List<IFormFile> paymentSlips)
        {
            try
            {
                var reviewerEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
                var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();
                var allowedRoles = new[] { "CEO", "Admin", "Manager", "Accounts Head", "Accounts Assistant" };
                var allowedEmails = new[] { "asma@mytecheng.com", "munawar.hasan@mytecheng.com", "shahbaz.ali@mytecheng.com", "faisal.ghani@mytecheng.com", "abdul.majeed@mytecheng.com" };

                if (!roles.Any(r => allowedRoles.Contains(r)) && !allowedEmails.Contains(reviewerEmail, StringComparer.OrdinalIgnoreCase))
                    return Forbid();

                var result = await _service.ReleaseAmountAsync(id, dto, paymentSlips);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/payments")]
        public async Task<ActionResult<AmountRequestFormDto>> AddPayment(int id, [FromBody] CreateAmountRequestPaymentDto dto)
        {
            try
            {
                var result = await _service.AddPaymentAsync(id, dto);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/attachments")]
        public async Task<ActionResult<AmountRequestFormDto>> UploadAttachment(int id, Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            try
            {
                var result = await _service.UploadAttachmentAsync(id, file);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.DeleteAsync(id);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("bulk-delete")]
        public async Task<IActionResult> BulkDelete([FromBody] List<int> ids)
        {
            try
            {
                await _service.BulkDeleteAsync(ids);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
