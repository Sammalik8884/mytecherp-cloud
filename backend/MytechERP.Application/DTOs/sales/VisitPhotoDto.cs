using System;

namespace MytechERP.Application.DTOs.Sales
{
    public class VisitPhotoDto
    {
        public int Id { get; set; }
        public string PhotoUrl { get; set; } = string.Empty;
        public string? Caption { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
