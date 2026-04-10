using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Quotations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.CRM
{
    public class Customer : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string Name { get; set; }=string.Empty;
        public string Email { get; set; }=string.Empty ;
        public string Phone {  get; set; }=string.Empty ;
        public string TaxNumber {  get; set; }=string.Empty ;
        public string Address { get; set; } = string.Empty;
        public bool IsProspect { get; set; } = true;
        
        public string? ContactPersonName { get; set; }
        public bool HasVisitingCard { get; set; } = false;
        public string? ContractorCompanyName { get; set; }
        public string? FurtherDetails { get; set; }

        public ICollection<Site> Sites { get; set; } = new List<Site>();
        public ICollection<Contract> Contracts { get;set; } = new List<Contract>();
        public string? CompanyName { get; set; }
        [MaxLength(100)]
        public string SiteName { get; set; } = string.Empty;
        public ICollection<Quotation> Quotations { get; set; }= new List<Quotation>();
    }

}
