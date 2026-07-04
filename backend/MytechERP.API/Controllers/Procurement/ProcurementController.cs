using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.Procurement;
using MytechERP.Application.Interfaces;
using MytechERP.Application.Interfaces.HR;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers.Procurement
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProcurementController : ControllerBase
    {
        private readonly IProcurementService _procurementService;
        private readonly IEmployeeInfoService _employeeInfoService;

        public ProcurementController(IProcurementService procurementService, IEmployeeInfoService employeeInfoService)
        {
            _procurementService = procurementService;
            _employeeInfoService = employeeInfoService;
        }

        private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        private string CurrentUserEmail => User.FindFirst(ClaimTypes.Email)?.Value ?? "";

        // Get role implies looking up from claims or db. In real app, you might have ClaimTypes.Role
        private string CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value ?? "SiteSupervisor"; 
        private string CurrentUserName => User.FindFirst("FullName")?.Value ?? CurrentUserEmail;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _procurementService.GetAllProcurementsAsync(CurrentUserEmail, CurrentUserRole);
            return Ok(data);
        }

        [HttpGet("pending-pd")]
        public async Task<IActionResult> GetPendingPd()
        {
            var data = await _procurementService.GetPendingPdApprovalsAsync();
            return Ok(data);
        }

        [HttpGet("approved")]
        public async Task<IActionResult> GetApproved()
        {
            var data = await _procurementService.GetApprovedRequestsAsync();
            return Ok(data);
        }

        [HttpGet("pending-executive")]
        public async Task<IActionResult> GetPendingExecutive()
        {
            var data = await _procurementService.GetPendingProcurementsForExecutiveAsync(CurrentUserEmail);
            return Ok(data);
        }

        [HttpGet("completed-executive")]
        public async Task<IActionResult> GetCompletedExecutive()
        {
            var data = await _procurementService.GetCompletedProcurementsForExecutiveAsync(CurrentUserEmail);
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _procurementService.GetByIdAsync(id);
            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProcurementRequestDto dto)
        {
            var data = await _procurementService.CreateRequestAsync(dto, CurrentUserName, CurrentUserEmail);
            return Ok(data);
        }

        [HttpPost("{id}/rh-review")]
        public async Task<IActionResult> RegionalHeadReview(int id, [FromBody] RegionalHeadReviewDto dto)
        {
            var data = await _procurementService.ReviewByRegionalHeadAsync(id, dto, CurrentUserEmail);
            return Ok(data);
        }

        [HttpPost("{id}/pd-review")]
        public async Task<IActionResult> PdReview(int id, [FromBody] PdReviewProcurementDto dto)
        {
            var data = await _procurementService.ReviewByPdAsync(id, dto, CurrentUserEmail);
            return Ok(data);
        }

        [HttpPost("{id}/submit-quotes")]
        public async Task<IActionResult> SubmitQuotes(int id, [FromBody] SubmitVendorQuotesDto dto)
        {
            var data = await _procurementService.SubmitVendorQuotesAsync(id, dto);
            return Ok(data);
        }

        [HttpPost("{id}/generate-arf")]
        public async Task<IActionResult> GenerateArf(int id)
        {
            // The URL could be dynamic depending on frontend
            var data = await _procurementService.GenerateArfAsync(id, CurrentUserEmail, "/finance/arf");
            return Ok(data);
        }

        [HttpPost("{id}/procure")]
        public async Task<IActionResult> Procure(int id)
        {
            var data = await _procurementService.ProcureAsync(id);
            return Ok(data);
        }

        [HttpPost("{id}/assign")]
        public async Task<IActionResult> Assign(int id, [FromBody] AssignProcurementExecutiveDto dto)
        {
            var data = await _procurementService.AssignExecutiveAsync(id, dto);
            return Ok(data);
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> Complete(int id, [FromForm] string? deliveryNoteText, [FromForm] List<Microsoft.AspNetCore.Http.IFormFile>? deliveryNoteDocuments, [FromServices] IBlobService blobService)
        {
            var urls = new System.Collections.Generic.List<string>();
            if (deliveryNoteDocuments != null && deliveryNoteDocuments.Count > 0)
            {
                foreach (var file in deliveryNoteDocuments)
                {
                    var url = await blobService.UploadAsync(file, file.FileName);
                    urls.Add(url);
                }
            }

            var dto = new CompleteProcurementDto 
            { 
                DeliveryNoteText = deliveryNoteText, 
                DeliveryNoteDocuments = urls 
            };
            var data = await _procurementService.CompleteProcurementAsync(id, dto);
            return Ok(data);
        }

        [HttpPost("{id}/accept")]
        public async Task<IActionResult> Accept(int id, [FromBody] AcceptProcurementDto dto)
        {
            var data = await _procurementService.AcceptDeliveryAsync(id, dto, CurrentUserEmail);
            return Ok(data);
        }
    }
}
