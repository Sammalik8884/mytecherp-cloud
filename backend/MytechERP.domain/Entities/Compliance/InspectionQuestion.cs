using MytechERP.domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.Complaiance
{
    public class InspectionQuestion : BaseEntity
    {
        [Required]
        public string AssetType { get; set; }=string.Empty;
        [Required]
        public string QuestionText { get; set; }= string.Empty;
        public string RegulationReference { get; set; } = string.Empty;
        public string ResponseType {  get; set; } = string.Empty;
        public int SortOrder { get; set; }

    }
}
