using MytechERP.domain.Common;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.domain.Entities.Procurement
{
    public class Vendor : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string VendorName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? CityName { get; set; }

        [MaxLength(100)]
        public string? ContactPerson { get; set; }

        [MaxLength(50)]
        public string? ContactNumber { get; set; }

        [MaxLength(200)]
        public string? BankAccountName { get; set; }

        [MaxLength(100)]
        public string? BankName { get; set; }

        [MaxLength(100)]
        public string? AccountNumber { get; set; }
    }
}
