using System;

namespace MytechERP.Application.DTOs.Finance
{
    public class ChequeDto
    {
        public int Id { get; set; }
        public string ChequeNumber { get; set; } = string.Empty;
        public decimal InitialAmount { get; set; }
        public decimal ReleasedAmount { get; set; }
        public decimal RemainingBalance { get; set; }
        public string PictureUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateChequeDto
    {
        public string ChequeNumber { get; set; } = string.Empty;
        public decimal InitialAmount { get; set; }
        public string PictureUrl { get; set; } = string.Empty;
    }

    public class UpdateChequeDto
    {
        public string? ChequeNumber { get; set; }
        public decimal? InitialAmount { get; set; }
        public string? PictureUrl { get; set; }
        public bool? IsActive { get; set; }
    }
}
