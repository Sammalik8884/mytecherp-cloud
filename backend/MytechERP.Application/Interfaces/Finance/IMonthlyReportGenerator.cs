using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces.Finance
{
    public interface IMonthlyReportGenerator
    {
        Task GenerateAndSendMonthlyReportAsync();
    }
}
