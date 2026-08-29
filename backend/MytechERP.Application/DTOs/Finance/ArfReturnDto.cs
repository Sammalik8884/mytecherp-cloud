using System;

namespace MytechERP.Application.DTOs.Finance
{
    public class ArfReturnDto
    {
        public int Id { get; set; }
        public int AmountRequestFormId { get; set; }
        public string ArfNumber { get; set; } = string.Empty;
        public decimal ReturnAmount { get; set; }
        public string Details { get; set; } = string.Empty;
        public DateTime ReturnDate { get; set; }
        public string ReturnedByEmail { get; set; } = string.Empty;
        public bool IsDebt { get; set; }
    }

    public class CreateArfReturnDto
    {
        public int AmountRequestFormId { get; set; }
        public decimal ReturnAmount { get; set; }
        public string Details { get; set; } = string.Empty;
    }
}
