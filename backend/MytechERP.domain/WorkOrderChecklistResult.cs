using MytechERP.domain.Common;
using MytechERP.domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain
{
    public class WorkOrderChecklistResult : BaseEntity
    {
        public int WorkOrderId { get; set; }
        public WorkOrder? WorkOrder { get; set; }
        public int ChecklistQuestionId { get; set; }
        public ChecklistQuestion? ChecklistQuestion { get; set; }
        public string SnapshotText { get; set; } = string.Empty;
        public string SnapshotJson { get; set; } = string.Empty;
        public string ResultValue { get; set; } = string.Empty;
        public bool IsFlagged { get; set; } = false;
        public string? Comment { get; set; }
        public string QuestionText { get; set; }
        public string Value { get; set; }
        public bool IsPass { get; set; }
    }
}
