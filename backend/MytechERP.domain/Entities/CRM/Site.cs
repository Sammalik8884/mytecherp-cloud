using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Quotations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.CRM
{
    public class Site : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        [Column("SiteName")]
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Address {  get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? ProjectStatus { get; set; }

        public int CustomerId {  get; set; }
        public Customer? Customer { get; set; }
        public ICollection<Building> Buildings { get; set; } = new List<Building>();
        public int CategoryId { get; set; }
        public ICollection<Quotation> Quotations { get; set; }= new List<Quotation>();
      
    }
}
