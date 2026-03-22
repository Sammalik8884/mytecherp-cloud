using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Roles;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ContractsController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly IPdfService _pdfService;

        public ContractsController(IContractService contractService, IPdfService pdfService)
        {
            _contractService = contractService;
            _pdfService = pdfService;
        }
        [HttpPost]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<ActionResult> Create(CreateContractDto request)
        {
            var id = await _contractService.CreateContractAsync(request);
            return Ok(new { Message = " Contract Created ", Id = id });
        }
        [HttpGet]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<ActionResult<List<ContractDto>>> GetAll()
        {
            var contracts = await _contractService.GetAllContractsAsync();
            return Ok(contracts);
        }
        [HttpGet("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<ActionResult<ContractDto>> GetById(int id)
        {
            var contract = await _contractService.GetContractByIdAsync(id);

            if (contract == null)
            {
                return NotFound($"Contract with ID {id} not found.");
            }

            return Ok(contract);
        }
        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Update(int id, UpdateContractDto request)
        {
            var success = await _contractService.UpdateContractAsync(id, request);
            if (!success) return NotFound("Contract not found or ID mismatch.");

            return NoContent();
        }
        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _contractService.DeleteContractAsync(id);
                if (!success) return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot delete this contract because it has linked records (e.g. invoices or associated work orders). Please delete or reassign those associated records first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }
        [HttpPost("add-asset")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> AddAssetToContract(CreateContractItemDto request)
        {
            try
            {
                await _contractService.AddAssetToContractAsync(request);
                return Ok(new { Message = "Asset successfully linked to Contract!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [HttpDelete("remove-asset/{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> RemoveAsset(int id)
        {
            try
            {
                await _contractService.DeleteAssetContractAsync(id);
                return Ok(new { Message = "item deleted successfuly" });
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot remove this asset from the contract due to linked constraints (e.g. existing work orders on this asset)." });
                }

                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("{id}/pdf")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> DownloadContractPdf(int id)
        {
            try
            {
                var pdfBytes = await _pdfService.GenerateContractPdfAsync(id);
                return File(pdfBytes, "application/pdf", $"AMC-Contract-{id}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}

