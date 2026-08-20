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
    public class ArfExceptionsController : ControllerBase
    {
        private readonly IArfExceptionService _service;

        public ArfExceptionsController(IArfExceptionService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<ActionResult<ArfExceptionRequestDto>> Create([FromBody] CreateArfExceptionRequestDto dto)
        {
            try
            {
                var result = await _service.CreateAsync(dto);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/approve")]
        public async Task<ActionResult<ArfExceptionRequestDto>> Approve(int id, [FromBody] ApproveArfExceptionRequestDto dto)
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

        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<ArfExceptionRequestDto>>> GetPending()
        {
            var result = await _service.GetAllPendingAsync();
            return Ok(result);
        }

        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<ArfExceptionRequestDto>>> GetMyRequests()
        {
            var result = await _service.GetMyRequestsAsync();
            return Ok(result);
        }
    }
}
