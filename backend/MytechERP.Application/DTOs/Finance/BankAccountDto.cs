using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Finance
{
    public class BankAccountDto
    {
        public int Id { get; set; }
        [Required]
        public string BankName { get; set; } = string.Empty;
        [Required]
        public string AccountNumber { get; set; } = string.Empty;
        [Required]
        public string AccountTitle { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
}
