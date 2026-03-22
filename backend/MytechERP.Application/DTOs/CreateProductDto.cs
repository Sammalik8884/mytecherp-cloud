using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs
{
    public class CreateProductDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Range(1, 10000000)]
        public decimal Price { get; set; } 

        public IFormFile? Image { get; set; } 

        public int CategoryId { get; set; }

        

        public decimal? PriceAED { get; set; }
        public string? Description { get; set; }
        public string? Brand { get; set; }
        public string? ItemCode { get; set; }
        public decimal CostPrice { get; set; }
        public int ReorderLevel { get; set; }
    }
}