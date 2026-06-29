using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs;
using MytechERP.Application.Interfaces;
using MytechERP.Infrastructure.Persistance;
using MytechERP.domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class ActivityService : IActivityService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public ActivityService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        private IQueryable<AuditLog> GetBaseQuery()
        {
            var tenantId = _currentUserService.TenantId ?? 0;
            return _context.AuditLogs.Where(a => a.TenantId == tenantId);
        }

        public async Task<(List<ActivityDto> Data, int TotalCount)> GetActivitiesAsync(string? userId, DateTime? startDate, DateTime? endDate, int page, int pageSize)
        {
            var query = GetBaseQuery();

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(a => a.UserId == userId);
            }

            if (startDate.HasValue)
            {
                query = query.Where(a => a.Timestamp >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                var end = endDate.Value.AddDays(1).AddTicks(-1);
                query = query.Where(a => a.Timestamp <= end);
            }

            var totalCount = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userIds = logs.Select(l => l.UserId).Distinct().ToList();
            var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

            var data = logs.Select(l => new ActivityDto
            {
                Id = l.Id,
                EntityName = l.EntityName,
                EntityId = l.EntityId,
                Action = l.Action,
                UserId = l.UserId,
                UserName = users.ContainsKey(l.UserId) ? users[l.UserId] : "System",
                Timestamp = l.Timestamp,
                Details = l.Details,
                OldValue = l.OldValue,
                NewValue = l.NewValue
            }).ToList();

            return (data, totalCount);
        }

        public async Task<ActivityStatsDto> GetActivityStatsAsync(string? userId, DateTime? startDate, DateTime? endDate)
        {
            var query = GetBaseQuery();

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(a => a.UserId == userId);
            }

            if (startDate.HasValue)
            {
                query = query.Where(a => a.Timestamp >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                var end = endDate.Value.AddDays(1).AddTicks(-1);
                query = query.Where(a => a.Timestamp <= end);
            }

            var logs = await query.Select(a => new { a.Timestamp, a.Action }).ToListAsync();

            var stats = new ActivityStatsDto
            {
                TotalActivities = logs.Count,
                ActivitiesByDate = logs.GroupBy(l => l.Timestamp.Date.ToString("yyyy-MM-dd"))
                                       .ToDictionary(g => g.Key, g => g.Count()),
                ActivitiesByAction = logs.GroupBy(l => l.Action)
                                         .ToDictionary(g => g.Key, g => g.Count())
            };

            return stats;
        }
    }
}
