using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.CRM
{
    public class Building : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string Name {  get; set; }=string.Empty;
        public int SiteId {  get; set; }
        public Site? Site { get; set; }
        public ICollection<Floor> Floors { get; set; } = new List<Floor>();

    }
}
