using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Roles;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AssetsController : ControllerBase
    {
        private readonly IAssetService _assetService;

        private readonly IAssetImportService _assetImportService;

        public AssetsController(IAssetService assetService, IAssetImportService assetImportService)
        {
            _assetService = assetService;
            _assetImportService = assetImportService;
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Create(CreateAssetDto request)
        {
            try
            {
                var id = await _assetService.CreateAssetAsync(request);
                return Ok(new { Id = id, Message = "Asset Created Successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message }); 
            }
        }

        [HttpPost("import")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Import(IFormFile file, [FromQuery] bool isDryRun = true)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var ext = Path.GetExtension(file.FileName);
            if (!ext.Equals(".csv", StringComparison.OrdinalIgnoreCase) && 
                !ext.Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Invalid file format. Please upload a CSV or XLSX file.");

            using var stream = file.OpenReadStream();
            var result = await _assetImportService.ImportFromExcelOrCsvAsync(stream, file.FileName, isDryRun);

            if (result.IsSuccess)
            {
                return Ok(result);
            }
            else
            {
                return BadRequest(result);
            }
        }

       
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var assets = await _assetService.GetAllAssetAsync();
            return Ok(assets);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetBySite(int siteId)
        {
            var assets = await _assetService.GetAssetsBySiteIdAsync(siteId);
            return Ok(assets);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var asset = await _assetService.GetAssetByIdAsync(id);
            if (asset == null) return NotFound();
            return Ok(asset);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Update(int id, UpdateAssetDto request)
        {
            if (id != request.Id) return BadRequest("ID mismatch");

            var success = await _assetService.UpdateAssetAsync(id, request);
            if (!success) return NotFound();

            return Ok(new { Message = "Asset Updated Successfully" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _assetService.DeleteAssetAsync(id);
                if (!success) return NotFound();

                return Ok(new { Message = "Asset Deleted Successfully" });
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex.GetType().Name == "DbUpdateException")
                {
                    return BadRequest(new { Error = "Cannot delete this asset because it has linked records (e.g. work orders, contracts). Please delete or reassign those associated records first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

    }
}