namespace MytechERP.Application.DTOs.Sales
{
    public class UpdateSalesLeadDto
    {
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Using string to map from enum easily
    }
}
