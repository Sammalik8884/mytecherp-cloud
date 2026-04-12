namespace MytechERP.Application.DTOs.Quotations
{
    public class QuotationItemDto
    {
        public int Id { get; set; }

        public int? ProductId { get; set; }

        public string Description { get; set; }
        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal LineTotal { get; set; }

        public string ItemType { get; set; } = "Local";
        public string? ServiceName { get; set; }
        public decimal OriginalPrice { get; set; }
        public string? CalculationBreakdown { get; set; }
    }
}