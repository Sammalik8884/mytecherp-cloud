using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.domain.Roles;
using MytechERP.Application.DTOs;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.Services;
using System.Security.Claims;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WorkOrdersController : ControllerBase
    {

        private readonly IWorkOrderService _service;
        private readonly IBlobService _blobService;
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public WorkOrdersController(IWorkOrderService service, ApplicationDbContext context,IBlobService blobService, ICurrentUserService currentUserService )
        {
            _service = service;
            _blobService = blobService;
            _context = context;
            _currentUserService = currentUserService;
        }

 
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost]
        public async Task<ActionResult<WorkOrderDto>> Create(CreateWorkOrderDto request)
        {
            try
            {
                var result = await _service.CreateWorkOrderAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(ex.Message); 
            }
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpGet]
        public async Task<ActionResult<List<WorkOrderDto>>> GetAll([FromQuery] MytechERP.Application.Filters.PaginationFilter filter)
        {
            return Ok(await _service.GetAllWorkOrdersAsync(filter));
        }


        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet("{id}")]
        public async Task<ActionResult<WorkOrderDto>> GetById(int id)
        {
            var result = await _service.GetWorkOrderByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateWorkOrderDto request)
        {
            if (request == null) return BadRequest("Request body is null.");
            if (id != request.Id) return BadRequest($"URL ID ({id}) does not match body ID ({request?.Id}).");

            var success = await _service.UpdateWorkOrderAsync(id, request);
            if (!success) return NotFound($"Service failed to update Work Order #{id}. Maybe it wasn't found.");

            return Ok(new { Message = "Job updated successfully." });
        }

        [Authorize(Roles = "Admin")] 
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _service.DeleteWorkOrderAsync(id);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex.GetType().Name == "DbUpdateException")
                {
                    return BadRequest(new { Error = "Cannot delete this work order because it has linked records (e.g. invoices, time logs). Please delete or reassign those associated records first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        
        [Authorize(Roles = Roles.Technician + "," + Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Engineer)]
        [HttpGet("my-jobs")]
        public async Task<ActionResult<List<WorkOrderDto>>> GetMyJobs()
        {
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null) return Unauthorized();

            var jobs = await _service.GetMyJobsAsync(userId);
            return Ok(jobs);
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpPost("{id}/initialize")]
        public async Task<IActionResult> InitializeInspection(int id)
        {
            try
            {
                var result = await _service.InitializeInspectionAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet("{id}/checklist")]
        public async Task<IActionResult> GetChecklist(int id)
        {
            var checklist = await _service.GetChecklistAsync(id);
            return Ok(checklist);
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpPut("{id}/checklist")]
        public async Task<IActionResult> SubmitChecklist(int id, [FromBody] List<UpdateChecklistDto> answers)
        {
            var success = await _service.SubmitChecklistAsync(id, answers);

            if (!success)
                return BadRequest("Failed to save checklist.");

            return Ok(new { Message = "Inspection saved successfully" });
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpPost("{id}/evidence")]
        public async Task<IActionResult> UploadEvidence(int id, [FromForm] UploadEvidenceDto request)
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest("No file uploaded.");

            try
            {
                using (var stream = request.File.OpenReadStream())
                {
                    var result = await _service.AddEvidenceAsync(id, stream, request.File.FileName, request.File.ContentType, request.Latitude, request.Longitude);
                    return Ok(result);
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
       

        [HttpPost("{id}/complete")]
        [Authorize(Roles = Roles.Technician + "," + Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Engineer)]
        public async Task<IActionResult> CompleteJob(int id, [FromBody] CompleteJobRequest request)
        {
            try
            {
                var success = await _service.CompleteJobAsync(id, request.Notes, request.Result);

                if (!success) return NotFound("Work Order not found.");

                return Ok(new { Message = "Job Completed and Locked successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = "Compliance Failure", Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Error = "Auth Failure", Message = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = Roles.Manager + "," + Roles.Engineer + "," + Roles.Admin)]
        public async Task<IActionResult> ApproveJob(int id, [FromBody] bool isApproved)
        {
            try
            {
                var success = await _service.ApproveJobAsync(id, isApproved);

                if (!success) return NotFound("Work Order not found.");

                return Ok(new
                {
                    Message = isApproved ? "Job Approved and Closed." : "Job Rejected. Sent back to Technician.",
                    Status = isApproved ? "Approved" : "Rejected"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = "Workflow Violation", Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                 return Unauthorized(new { Error = "Auth Failure", Message = ex.Message });
            }
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        [HttpPost("create-from-quote")]
        public async Task<IActionResult> CreateFromQuote([FromBody] CreateRepairJobDto dto)
        {
            try
            {
                var jobId = await _service.CreateWorkOrderFromQuoteAsync(dto);
                return Ok(new { Message = "Repair Job Created Successfully", JobId = jobId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPut("{id}/assign")]
        [Authorize(Roles = "Admin,Manager,Engineer")]
        public async Task<IActionResult> AssignTechnician(int id, [FromBody] AssignTechnicianDto dto)
        {
            try
            {
                var success = await _service.AssignTechnicianAsync(id, dto);
                if (!success) return NotFound();

                return Ok(new { Message = "Technician assigned successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An unexpected error occurred: " + ex.Message });
            }
        }
    }

}
