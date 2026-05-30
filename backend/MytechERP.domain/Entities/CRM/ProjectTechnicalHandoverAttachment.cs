namespace MytechERP.domain.Entities.CRM
{
    public class ProjectTechnicalHandoverAttachment
    {
        public int Id { get; set; }
        public int ProjectTechnicalHandoverId { get; set; }
        public ProjectTechnicalHandover ProjectTechnicalHandover { get; set; }
        
        public string FileName { get; set; }
        public string FileUrl { get; set; }
    }
}
