using System;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.sales
{
    public class CreateSalesMeetingReminderDto
    {
        [Required]
        public string SiteName { get; set; } = string.Empty;

        [Required]
        public DateTime MeetingDate { get; set; }

        public bool IsTimeIncluded { get; set; }
    }

    public class SalesMeetingReminderDto
    {
        public int Id { get; set; }
        public string SalesmanUserId { get; set; } = string.Empty;
        public string SalesmanName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public DateTime MeetingDate { get; set; }
        public bool IsTimeIncluded { get; set; }
        public bool IsNotified { get; set; }
        public bool IsPopupAcknowledged { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
