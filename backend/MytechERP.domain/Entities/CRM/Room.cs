using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.CRM
{
    public class Room :BaseEntity
    {
         public string Name { get; set; }= string.Empty;
        public int FloorId {  get; set; }
        public Floor? Floor {get; set; }  

    }
}
