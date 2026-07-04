using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ExpensesController : ControllerBase
    {
        private readonly IExpenseService _expenseService;

        public ExpensesController(IExpenseService expenseService)
        {
            _expenseService = expenseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var expenses = await _expenseService.GetAllAsync();
            return Ok(expenses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var expense = await _expenseService.GetByIdAsync(id);
            return Ok(expense);
        }

        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetBySiteId(int siteId)
        {
            var expenses = await _expenseService.GetBySiteIdAsync(siteId);
            return Ok(expenses);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
        {
            var expense = await _expenseService.CreateAsync(dto);
            return Ok(expense);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateExpenseDto dto)
        {
            var expense = await _expenseService.UpdateAsync(id, dto);
            return Ok(expense);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _expenseService.DeleteAsync(id);
            return Ok(new { message = "Expense deleted successfully" });
        }

        [HttpPost("{id}/review")]
        [Authorize(Roles = "Admin,Accounts Assistant,Accounts Head")]
        public async Task<IActionResult> Review(int id, [FromBody] ExpenseReviewDto dto)
        {
            var reviewerEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
            var expense = await _expenseService.ReviewExpenseAsync(id, dto, reviewerEmail);
            return Ok(expense);
        }

        [HttpPost("upload-attachment")]
        public async Task<IActionResult> UploadAttachment(Microsoft.AspNetCore.Http.IFormFile file, [FromServices] MytechERP.Application.Interfaces.IBlobService blobService)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided");
            
            var fileName = $"expense_{System.Guid.NewGuid()}_{file.FileName}";
            var url = await blobService.UploadAsync(file, fileName);
            return Ok(new { url });
        }
    }
}
