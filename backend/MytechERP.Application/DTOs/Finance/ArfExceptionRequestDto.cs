using System;
namespace MytechERP.Application.DTOs.Finance
{
    public class ArfExceptionRequestDto
    {
        public int Id { get; set; }
        public string EmployeeEmail { get; set; } = string.Empty;
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? MunawarComment { get; set; }
        public bool IsUsed { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
