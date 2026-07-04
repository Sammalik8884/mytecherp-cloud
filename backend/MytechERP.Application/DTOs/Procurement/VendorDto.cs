namespace MytechERP.Application.DTOs.Procurement
{
    public class VendorDto
    {
        public int Id { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public string? CityName { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactNumber { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
    }
}
