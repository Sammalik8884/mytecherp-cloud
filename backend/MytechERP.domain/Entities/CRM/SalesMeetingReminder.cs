using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.CRM
{
    public class SalesMeetingReminder
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string SalesmanUserId { get; set; } = string.Empty;

        [ForeignKey("SalesmanUserId")]
        public virtual AppUser? SalesmanUser { get; set; }

        [Required]
        [MaxLength(255)]
        public string SiteName { get; set; } = string.Empty;

        [Required]
        public DateTime MeetingDate { get; set; }

        public bool IsTimeIncluded { get; set; }

        public bool IsNotified { get; set; } = false;

        public bool IsPopupAcknowledged { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
