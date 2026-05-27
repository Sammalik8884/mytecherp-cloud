namespace MytechERP.domain.Entities.CRM
{
    public class MaterialReceivingItem
    {
        public int Id { get; set; }
        
        public int MaterialReceivingFormId { get; set; }
        public MaterialReceivingForm? Form { get; set; }
        
        public string ItemName { get; set; } = string.Empty;
        public string LocationValue { get; set; } = string.Empty; // Value for "At Location- XYZ"
        public string Received { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }
}
