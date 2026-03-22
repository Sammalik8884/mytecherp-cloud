using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Roles;
using MytechERP.API.Filters;
using MytechERP.domain.Enums;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [RequirePlanFeature(PlanFeature.ChecklistFormBuilder)]
    public class ChecklistsController : ControllerBase
    {
        private readonly ICheckListService _service;
        public ChecklistsController(ICheckListService service)
        {
            _service = service;
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Create(ChecklistQuestionRequestDto request)
        {
            var result = await _service.CreateQuestionAsync(request);
            return Ok(result);
        }

        [HttpGet("category/{categoryId}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var result = await _service.GetTemplateByCategoryAsync(categoryId);
            return Ok(result);
        }

    }
}

