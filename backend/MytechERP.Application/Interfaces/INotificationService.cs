using MytechERP.domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string userId);
        Task<IEnumerable<Notification>> GetAllNotificationsAsync(string userId, int limit = 50);
        Task<Notification> CreateNotificationAsync(string userId, string title, string message, string type, int? targetId = null);
        Task MarkAsReadAsync(int notificationId, string userId);
        Task MarkAllAsReadAsync(string userId);
        Task<int> GetUnreadCountAsync(string userId);
    }
}
