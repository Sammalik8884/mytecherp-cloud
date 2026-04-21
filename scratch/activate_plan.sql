-- Find the latest tenant
SELECT TOP 5 Id, CompanyName, SubscriptionPlan, CreatedAt FROM Tenants ORDER BY Id DESC;

-- Find subscription plans
SELECT Id, Name, MaxUsers, PlanFeatures, MonthlyPrice FROM SubscriptionPlans WHERE IsActive = 1;

-- Find latest tenant's existing subscription
SELECT ts.Id, ts.TenantId, ts.SubscriptionPlanId, ts.SubscriptionStatus, ts.CurrentPeriodEnd
FROM TenantSubscriptions ts
ORDER BY ts.TenantId DESC;
