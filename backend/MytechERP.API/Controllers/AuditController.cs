using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.domain.Roles;
using MytechERP.Infrastructure.Persistance;
using MytechERP.API.Filters;
using MytechERP.domain.Enums;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
    [RequirePlanFeature(PlanFeature.AuditLogs)]
    public class AuditController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("quotation/{id}")]
        public async Task<IActionResult> GetQuotationHistory(int id)
        {
            var logs = await _context.AuditLogs
                .Where(x => x.EntityName == "Quotation" && x.EntityId == id)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();

            var userIds = logs.Select(l => l.UserId).Distinct().ToList();
            var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

            var history = logs.Select(x => new
            {
                x.Id,
                x.Action,
                x.Details,
                x.OldValue,
                x.NewValue,
                x.EntityName,
                x.EntityId,
                ChangedBy = x.UserId,
                ChangedByName = users.ContainsKey(x.UserId) ? users[x.UserId] : "System",
                Date = x.Timestamp
            });

            return Ok(history);
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentLogs([FromQuery] string? entityName)
        {
            var query = _context.AuditLogs.AsQueryable();
            if (!string.IsNullOrEmpty(entityName))
            {
                query = query.Where(x => x.EntityName == entityName);
            }
            
            var logs = await query
                .OrderByDescending(x => x.Timestamp)
                .Take(100)
                .ToListAsync();

            var userIds = logs.Select(l => l.UserId).Distinct().ToList();
            var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

            var history = logs.Select(x => new
            {
                x.Id,
                x.Action,
                x.Details,
                x.OldValue,
                x.NewValue,
                x.EntityName,
                x.EntityId,
                ChangedBy = x.UserId,
                ChangedByName = users.ContainsKey(x.UserId) ? users[x.UserId] : "System",
                Date = x.Timestamp
            });

            return Ok(history);
        }
    }
}