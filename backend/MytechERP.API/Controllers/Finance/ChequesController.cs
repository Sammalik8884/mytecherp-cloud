using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers.Finance
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ChequesController : ControllerBase
    {
        private readonly IChequeService _chequeService;

        public ChequesController(IChequeService chequeService)
        {
            _chequeService = chequeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _chequeService.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            return Ok(await _chequeService.GetByIdAsync(id));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateChequeDto dto)
        {
            return Ok(await _chequeService.CreateAsync(dto));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateChequeDto dto)
        {
            return Ok(await _chequeService.UpdateAsync(id, dto));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _chequeService.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("upload-picture")]
        public async Task<IActionResult> UploadPicture(IFormFile file)
        {
            var url = await _chequeService.UploadPictureAsync(file);
            return Ok(new { url });
        }
    }
}
