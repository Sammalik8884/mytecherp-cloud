using MytechERP.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IActivityService
    {
        Task<(List<ActivityDto> Data, int TotalCount)> GetActivitiesAsync(string? userId, DateTime? startDate, DateTime? endDate, int page, int pageSize);
        Task<ActivityStatsDto> GetActivityStatsAsync(string? userId, DateTime? startDate, DateTime? endDate);
    }
}
