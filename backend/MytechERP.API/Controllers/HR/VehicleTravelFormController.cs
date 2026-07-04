using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.HR;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers.HR
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VehicleTravelFormController : ControllerBase
    {
        private readonly IVehicleTravelFormService _service;
        private readonly ICurrentUserService _currentUserService;

        public VehicleTravelFormController(IVehicleTravelFormService service, ICurrentUserService currentUserService)
        {
            _service = service;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateVehicleTravelFormDto dto)
        {
            var userId = _currentUserService.UserId;
            var result = await _service.CreateAsync(dto, userId);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userEmail = _currentUserService.Email;
            var userId = _currentUserService.UserId;
            var result = await _service.GetAllAsync(userEmail, userId);
            return Ok(result);
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var userEmail = _currentUserService.Email;
            await _service.ApproveAsync(id, userEmail);
            return Ok();
        }
    }
}
