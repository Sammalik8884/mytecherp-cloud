using System;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.domain.Entities.Finance
{
    public class ArfExceptionRequest
    {
        [Key]
        public int Id { get; set; }
        public string EmployeeEmail { get; set; } = string.Empty;
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string? MunawarComment { get; set; }
        public bool IsUsed { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
