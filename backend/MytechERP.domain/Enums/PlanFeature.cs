namespace MytechERP.domain.Enums
{
    /// <summary>
    /// Bitmask of Pro-tier features a subscription plan may unlock.
    /// Basic plans have PlanFeatures = None.
    /// Pro plans have all flags set.
    /// </summary>
    [Flags]
    public enum PlanFeature
    {
        None                  = 0,
        HrPayroll             = 1,
        ChecklistFormBuilder  = 2,
        AuditLogs             = 4,
        AdvancedAnalytics     = 8,
        OfflineSync           = 16
    }
}
