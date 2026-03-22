using MytechERP.domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace MytechERP.domain.Common
{
    public abstract class BaseEntity
    {
        public int Id {  get; set; }
        [JsonIgnore]
        public int  TenantId { get; set; }
    }
}
