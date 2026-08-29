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
    public class ArfReturnsController : ControllerBase
    {
        private readonly IArfReturnService _service;

        public ArfReturnsController(IArfReturnService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<List<ArfReturnDto>>> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ArfReturnDto>> Create([FromBody] CreateArfReturnDto dto)
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

        [HttpGet("debt")]
        public async Task<ActionResult<decimal>> GetDebtBalance()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
            var result = await _service.GetDebtBalanceAsync(email);
            return Ok(result);
        }
    }
}
