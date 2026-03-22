using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.domain.Roles;
using MytechERP.Application.DTOs.HR;
using MytechERP.Application.Interfaces;
using MyTechERP.Infrastructure.Services;
using MytechERP.API.Filters;
using MytechERP.domain.Enums;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
    [RequirePlanFeature(PlanFeature.HrPayroll)]
    public class PayrollController : ControllerBase
    {
        private readonly IPayrollService _payrollService;
        private readonly IPdfService _pdfService;

        public PayrollController(IPayrollService payrollService, IPdfService pdfService )
        {
            _payrollService = payrollService;
            _pdfService = pdfService;
        }

        [HttpGet("profiles")]
        public async Task<IActionResult> GetProfiles()
        {
            try
            {
                var profiles = await _payrollService.GetAllProfilesAsync();
                return Ok(profiles);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("payslips")]
        public async Task<IActionResult> GetPayslips()
        {
            try
            {
                var payslips = await _payrollService.GetPayslipsAsync();
                return Ok(payslips);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("entry")]
        public async Task<IActionResult> AddPayrollEntry([FromBody] CreatePayrollEntryDto dto)
        {
            try
            {
                var entryId = await _payrollService.AddEntryAsync(dto);
                return Ok(new { Message = "Payroll entry added successfully", EntryId = entryId });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePayslip([FromBody] GeneratePayslipDto dto)
        {
            try
            {
                var payslip = await _payrollService.GeneratePayslipAsync(dto);
                return Ok(new { Message = "Payslip generated successfully", Payslip = payslip });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [HttpPost("profile")]
        public async Task<IActionResult> CreateProfile([FromBody] CreatePayrollProfileDto dto)
        {
            try
            {
                var profileId = await _payrollService.CreateProfileAsync(dto);
                return Ok(new { Message = "Payroll Profile created successfully", ProfileId = profileId });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [HttpPost("payslips/{id}/pay")]
        public async Task<IActionResult> ApproveAndPayPayslip(int id)
        {
            try
            {
                await _payrollService.ApproveAndPayPayslipAsync(id);
                return Ok(new { Message = "Payslip has been approved and marked as Paid." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        

        [HttpGet("payslips/{id}/download")]
        [AllowAnonymous] 
        public async Task<IActionResult> DownloadPayslipPdf(int id)
        {
            try
            {
                var pdfBytes = await _pdfService.GeneratePayslipPdfAsync(id);

              
                return File(pdfBytes, "application/pdf", $"Payslip_{id}.pdf");
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }


    }
}
