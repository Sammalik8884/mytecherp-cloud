using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs
{
    public class ActivityDto
    {
        public int Id { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? Details { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }
    
    public class ActivityStatsDto
    {
        public Dictionary<string, int> ActivitiesByDate { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ActivitiesByAction { get; set; } = new Dictionary<string, int>();
        public int TotalActivities { get; set; }
    }
}
