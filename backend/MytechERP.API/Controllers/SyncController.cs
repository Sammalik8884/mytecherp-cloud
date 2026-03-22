using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.DTOs.Sync;
using MyTechERP.Infrastructure.Services;
using MytechERP.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using MytechERP.domain.Roles;
using MytechERP.API.Filters;
using MytechERP.domain.Enums;

namespace MytechERP.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [RequirePlanFeature(PlanFeature.OfflineSync)]
    public class SyncController : ControllerBase
    {
        private readonly UniversalSyncService _syncService;
        private readonly ApplicationDbContext _context;

        public SyncController(UniversalSyncService syncService, ApplicationDbContext context)
        {
            _syncService = syncService;
            _context = context;
        }

        [HttpPost("pull")]
        public async Task<IActionResult> PullDelta([FromBody] SyncPullRequestDto request)
        {
            try
            {
                var response = await _syncService.PullDeltaAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                // Log exception here
                return StatusCode(500, new { message = "An error occurred during sync pull.", details = ex.Message });
            }
        }

        [HttpPost("push")]
        public async Task<IActionResult> PushBatch([FromBody] SyncPushRequestDto request)
        {
            try
            {
                var response = await _syncService.PushBatchAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                // Log exception here
                return StatusCode(500, new { message = "An error occurred during sync push.", details = ex.Message });
            }
        }

        [HttpGet("logs")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _context.SyncLogs
                .OrderByDescending(l => l.SyncTime)
                .Take(100)
                .ToListAsync();
            return Ok(logs);
        }

        [HttpGet("conflicts")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> GetConflicts()
        {
            var conflicts = await _context.SyncConflicts
                .OrderByDescending(c => c.ConflictTime)
                .Take(50)
                .ToListAsync();
            return Ok(conflicts);
        }
    }
}
