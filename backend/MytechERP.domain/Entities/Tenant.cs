using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities
{
    public class Tenant
    {
        [Key] 
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string CompanyName { get; set; }=string.Empty;
        public string SubscriptionPlan { get; set; } = "Free";
        public DateTime CreatedAt { get; set; }=DateTime.UtcNow;
        public DateTime SubscriptionExpiresAt { get; set; }
        public DateTime? TrialStartedAt { get; set; }
        public bool IsActive { get; set; }=true;

        
    }
}
