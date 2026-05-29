using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace MytechERP.Application.DTOs.CRM
{
    public class DailyProgressReportDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public DateTime Date { get; set; }
        public string SiteInCharge { get; set; }
        public string SiteOpeningTime { get; set; }
        public string SiteClosingTime { get; set; }
        public int TotalWorkers { get; set; }
        public string NextDayActivityPlan { get; set; }
        public string CreatedByUserName { get; set; }

        public List<DprActivityDto> Activities { get; set; } = new List<DprActivityDto>();
        public List<DprEmployeeDto> Employees { get; set; } = new List<DprEmployeeDto>();
        public List<DprMaterialDto> Materials { get; set; } = new List<DprMaterialDto>();
        public List<DprAttachmentDto> Attachments { get; set; } = new List<DprAttachmentDto>();
    }

    public class CreateDailyProgressReportDto
    {
        public int SiteId { get; set; }
        public DateTime Date { get; set; }
        public string SiteInCharge { get; set; }
        public string SiteOpeningTime { get; set; }
        public string SiteClosingTime { get; set; }
        public int TotalWorkers { get; set; }
        public string NextDayActivityPlan { get; set; }

        public List<string> Activities { get; set; } = new List<string>();
        public List<CreateDprEmployeeDto> Employees { get; set; } = new List<CreateDprEmployeeDto>();
        public List<CreateDprMaterialDto> Materials { get; set; } = new List<CreateDprMaterialDto>();
        
        public List<IFormFile> Files { get; set; } = new List<IFormFile>();
    }

    public class DprActivityDto
    {
        public int Id { get; set; }
        public string ActivityDone { get; set; }
    }

    public class CreateDprEmployeeDto
    {
        public string EmployeeName { get; set; }
        public string InTime { get; set; }
        public string OutTime { get; set; }
        public string OverTime { get; set; }
    }
    
    public class DprEmployeeDto : CreateDprEmployeeDto
    {
        public int Id { get; set; }
    }

    public class CreateDprMaterialDto
    {
        public string Item { get; set; }
        public string Quantity { get; set; }
        public string Remarks { get; set; }
    }

    public class DprMaterialDto : CreateDprMaterialDto
    {
        public int Id { get; set; }
    }

    public class DprAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
    }
}