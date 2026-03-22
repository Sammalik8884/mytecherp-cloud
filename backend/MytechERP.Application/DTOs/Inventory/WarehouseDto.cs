using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Inventory
{
    public class WarehouseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool IsMobile { get; set; }
    }

    public class CreateWarehouseDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool IsMobile { get; set; }
    }

    public class UpdateWarehouseDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool IsMobile { get; set; }
    }
}
