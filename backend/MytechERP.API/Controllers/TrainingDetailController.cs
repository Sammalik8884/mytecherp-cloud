using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TrainingDetailController : ControllerBase
    {
        private readonly ITrainingDetailService _service;

        public TrainingDetailController(ITrainingDetailService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingDetailDto>>> GetAll()
        {
            var details = await _service.GetAllAsync();
            return Ok(details);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingDetailDto>> GetById(int id)
        {
            var detail = await _service.GetByIdAsync(id);
            if (detail == null) return NotFound();
            
            return Ok(detail);
        }

        [HttpPost]
        public async Task<ActionResult<TrainingDetailDto>> Create([FromBody] TrainingDetailDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] TrainingDetailDto dto)
        {
            var success = await _service.UpdateAsync(id, dto);
            if (!success) return NotFound();
            
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound();
            
            return NoContent();
        }

        public class UpdateParticipantDto
        {
            public string Name { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty;
        }

        [HttpPut("participant/{id}")]
        public async Task<ActionResult> UpdateParticipant(int id, [FromBody] UpdateParticipantDto dto)
        {
            var success = await _service.UpdateParticipantAsync(id, dto.Name, dto.Status);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("participant/{id}")]
        public async Task<ActionResult> DeleteParticipant(int id)
        {
            var success = await _service.DeleteParticipantAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
