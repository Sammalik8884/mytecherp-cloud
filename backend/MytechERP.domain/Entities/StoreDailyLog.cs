using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities
{
    public class StoreDailyLog
    {
        public int Id { get; set; }
        
        public int SiteId { get; set; }
        public Site Site { get; set; } = null!;

        public DateTime Date { get; set; }
        public DateTime TimeOut { get; set; }
        public DateTime? TimeIn { get; set; }

        public ICollection<StoreDailyLogItem> Items { get; set; } = new List<StoreDailyLogItem>();
    }
}
