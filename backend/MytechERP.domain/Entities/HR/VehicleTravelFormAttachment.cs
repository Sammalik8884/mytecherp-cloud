using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.HR
{
    public class VehicleTravelFormAttachment : BaseEntity
    {
        public string FileName { get; set; }
        public string FileUrl { get; set; }

        public int VehicleTravelFormId { get; set; }
        public VehicleTravelForm VehicleTravelForm { get; set; }
    }
}
