namespace MytechERP.Application.DTOs.Finance
{
    public class CreateArfExceptionRequestDto
    {
        public string EmployeeEmail { get; set; } = string.Empty;
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
