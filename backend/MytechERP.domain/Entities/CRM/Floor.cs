using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.CRM
{
    public class Floor : BaseEntity
    {
        public string Name { get; set; }=string.Empty;
        public int BuildingId {  get; set; }
        public Building? Building { get; set; }
        public ICollection<Room> Rooms { get; set; } = new List<Room>();

    }
}
