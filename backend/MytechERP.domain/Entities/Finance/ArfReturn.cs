using MytechERP.domain.Common;
using System;

namespace MytechERP.domain.Entities.Finance
{
    public class ArfReturn : BaseEntity
    {
        public int AmountRequestFormId { get; set; }
        public AmountRequestForm AmountRequestForm { get; set; } = null!;
        public decimal ReturnAmount { get; set; }
        public string Details { get; set; } = string.Empty;
        public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
        public string ReturnedByEmail { get; set; } = string.Empty;
        public bool IsDebt { get; set; } = false;
    }
}
