using System;

using MytechERP.domain.Common;

namespace MytechERP.domain.Entities.HR
{
    public class ApplicationFormAttachment : BaseEntity
    {
        public int ApplicationFormId { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        
        public ApplicationForm ApplicationForm { get; set; }
    }
}
