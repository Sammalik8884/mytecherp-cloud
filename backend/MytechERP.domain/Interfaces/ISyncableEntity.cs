using System;

namespace MytechERP.domain.Interfaces
{
    public interface ISyncableEntity
    {
        int Id { get; set; }
        int TenantId { get; set; }
        DateTime UpdatedAt { get; set; }
        bool IsDeleted { get; set; }
    }
}
