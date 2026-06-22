using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Store
{
    public class StoreDailyLogDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public DateTime TimeOut { get; set; }
        public DateTime? TimeIn { get; set; }
        public List<StoreDailyLogItemDto> Items { get; set; } = new();
    }

    public class StoreDailyLogItemDto
    {
        public int Id { get; set; }
        public int StoreToolId { get; set; }
        public string ToolDescription { get; set; } = string.Empty;
        public string? CustomDescription { get; set; }
        public int QuantityOut { get; set; }
        public int? QuantityIn { get; set; }
    }

    public class CreateStoreDailyLogDto
    {
        public int SiteId { get; set; }
        public DateTime Date { get; set; }
        public DateTime TimeOut { get; set; }
        public List<CreateStoreDailyLogItemDto> Items { get; set; } = new();
    }

    public class CreateStoreDailyLogItemDto
    {
        public int StoreToolId { get; set; }
        public string? CustomDescription { get; set; }
        public int QuantityOut { get; set; }
    }

    public class CheckInStoreDailyLogDto
    {
        public DateTime TimeIn { get; set; }
        public List<CheckInStoreDailyLogItemDto> Items { get; set; } = new();
    }

    public class CheckInStoreDailyLogItemDto
    {
        public int StoreDailyLogItemId { get; set; }
        public int QuantityIn { get; set; }
    }
}
