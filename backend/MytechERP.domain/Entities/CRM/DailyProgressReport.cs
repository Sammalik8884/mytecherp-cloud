using System;
using System.Collections.Generic;
using MytechERP.domain.Entities;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class DailyProgressReport : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int SiteId { get; set; }
        public DateTime Date { get; set; }
        public string SiteInCharge { get; set; }
        public string SiteOpeningTime { get; set; }
        public string SiteClosingTime { get; set; }
        public int TotalWorkers { get; set; }
        public string NextDayActivityPlan { get; set; }

        public string CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }

        public Site Site { get; set; }
        public AppUser CreatedByUser { get; set; }

        public ICollection<DprActivity> Activities { get; set; }
        public ICollection<DprEmployee> Employees { get; set; }
        public ICollection<DprMaterial> Materials { get; set; }
        public ICollection<DprAttachment> Attachments { get; set; }

        public DailyProgressReport()
        {
            Activities = new List<DprActivity>();
            Employees = new List<DprEmployee>();
            Materials = new List<DprMaterial>();
            Attachments = new List<DprAttachment>();
        }
    }
}