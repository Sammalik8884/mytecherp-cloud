namespace MytechERP.Application.DTOs.Finance
{
    public class ApproveArfExceptionRequestDto
    {
        public bool IsApproved { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}
