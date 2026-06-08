using System;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class ProjectSpotCheckItem : BaseEntity, ISyncableEntity
    {
        public int ProjectSpotCheckId { get; set; }
        public ProjectSpotCheck? ProjectSpotCheck { get; set; }

        public string ItemText { get; set; } = string.Empty;
        
        public bool IsYes { get; set; }
        public bool IsNo { get; set; }
        public bool IsNA { get; set; }
        
        public string Comments { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
}
