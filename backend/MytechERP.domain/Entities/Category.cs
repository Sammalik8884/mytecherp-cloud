using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities
{
    public class Category : ISyncableEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public int TenantId {  get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string? Description { get; set; }
        [JsonIgnore]
        public ICollection<Product> Products { get; set;} = new List<Product>();



    }
}
