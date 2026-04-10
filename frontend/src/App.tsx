import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RoleProtectedRoute } from "./auth/RoleProtectedRoute";
import { FeatureProtectedRoute } from "./auth/FeatureProtectedRoute";
import { PlanFeature } from "./types/auth";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { CustomerPortalLayout } from "./layouts/CustomerPortalLayout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { SitesPage } from "./pages/SitesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ProductsPage } from "./pages/ProductsPage";
import { QuotationsPage } from "./pages/QuotationsPage";
import { QuotationFormPage } from "./pages/QuotationFormPage";
import { UsersPage } from "./pages/UsersPage";
import { AssetsPage } from "./pages/AssetsPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { MyJobsPage } from "./pages/MyJobsPage";
import { JobExecutionPage } from "./pages/JobExecutionPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InventoryPage } from "./pages/InventoryPage";
import { PayrollPage } from "./pages/PayrollPage";
import { ContractsPage } from "./pages/ContractsPage";
import { ProcurementPage } from "./pages/ProcurementPage";
import { ChecklistBuilderPage } from "./pages/ChecklistBuilderPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { SyncDashboardPage } from "./pages/SyncDashboardPage";
import { SalesLeadsPage } from "./pages/SalesLeadsPage";
import { SalesmanDashboardPage } from "./pages/SalesmanDashboardPage";
import { SiteVisitPage } from "./pages/SiteVisitPage";
import { BoqDrawingsPortalPage } from "./pages/BoqDrawingsPortalPage";
import { CustomerPortalDashboardPage } from "./pages/CustomerPortalDashboardPage";
import { CustomerInvoicesPage } from "./pages/CustomerInvoicesPage";
import { SubscriptionPlansPage } from "./pages/SubscriptionPlansPage";
import { SubscriptionSuccessPage } from "./pages/SubscriptionSuccessPage";
import { SubscriptionCancelPage } from "./pages/SubscriptionCancelPage";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./auth/AuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import SyncStatusWidget from "./components/common/SyncStatusWidget";

// Smart root route: Logged out -> landing.html, Logged in -> dashboard/portal
const RootRoute = () => {
    const { isAuthenticated, hasRole } = useAuth();
    
    if (!isAuthenticated) {
        window.location.href = "/landing";
        return null;
    }
    
    return hasRole(["Customer"]) ? <Navigate to="/portal" replace /> : <Navigate to="/dashboard" replace />;
};

function App() {
    return (
        <AuthProvider>
            <SyncProvider>
                <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<RootRoute />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            {/* CRM - Manager/Admin Only */}
                            <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager"]} />}>
                                <Route path="/customers" element={<CustomersPage />} />
                                <Route path="/sites" element={<SitesPage />} />
                            </Route>

                            {/* Catalog & Sales - Engineer/Manager/Admin Only */}
                            <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager", "Engineer", "Estimation"]} />}>
                                <Route path="/categories" element={<CategoriesPage />} />
                                <Route path="/products" element={<ProductsPage />} />
                                <Route path="/quotations" element={<QuotationsPage />} />
                                <Route path="/quotations/new" element={<QuotationFormPage />} />
                                <Route path="/quotations/edit/:id" element={<QuotationFormPage />} />
                                <Route path="/contracts" element={<ContractsPage />} />
                                <Route path="/sales/boq-portal" element={<BoqDrawingsPortalPage />} />
                            </Route>

                            {/* Sales & Leads - Salesman/Manager/Admin */}
                            <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager", "Salesman", "Estimation"]} />}>
                                <Route path="/sales/leads" element={<SalesLeadsPage />} />
                                <Route path="/sales/visit/:id" element={<SiteVisitPage />} />
                            </Route>
                            
                            <Route element={<RoleProtectedRoute allowedRoles={["Salesman"]} />}>
                                <Route path="/sales/my-dashboard" element={<SalesmanDashboardPage />} />
                            </Route>

                            {/* System Area / Admin - Manager/Admin Only */}
                            <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager"]} />}>
                                <Route path="/users" element={<UsersPage />} />
                                <Route element={<FeatureProtectedRoute requiredFeature={PlanFeature.HrPayroll} />}>
                                    <Route path="/payroll" element={<PayrollPage />} />
                                </Route>
                                <Route element={<FeatureProtectedRoute requiredFeature={PlanFeature.ChecklistFormBuilder} />}>
                                    <Route path="/checklists" element={<ChecklistBuilderPage />} />
                                </Route>
                                <Route element={<FeatureProtectedRoute requiredFeature={PlanFeature.AuditLogs} />}>
                                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                                </Route>
                                <Route element={<FeatureProtectedRoute requiredFeature={PlanFeature.OfflineSync} />}>
                                    <Route path="/sync-dashboard" element={<SyncDashboardPage />} />
                                </Route>
                                <Route path="/subscription/plans" element={<SubscriptionPlansPage />} />
                            </Route>
                            {/* Operations / Dispatch - Manager/Admin Only */}
                            <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager"]} />}>
                                <Route path="/assets" element={<AssetsPage />} />
                                <Route path="/work-orders" element={<WorkOrdersPage />} />
                                <Route path="/inventory" element={<InventoryPage />} />
                                <Route path="/procurement" element={<ProcurementPage />} />
                            </Route>

                            {/* Finance & Invoicing - Manager/Admin Only */}
                            <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager"]} />}>
                                <Route path="/invoices" element={<InvoicesPage />} />
                            </Route>

                            {/* Field Services - Anyone with a Job (Engineer/Worker/Tech/Admin) */}
                            <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager", "Engineer", "Worker", "Technician"]} />}>
                                <Route path="/my-jobs" element={<MyJobsPage />} />
                                <Route path="/job/:id" element={<JobExecutionPage />} />
                            </Route>

                            {/* Future Iterations will add more routes here */}
                        </Route>

                        {/* Subscription Finalization Routes (Full Screen, No Sidebar) */}
                        <Route element={<RoleProtectedRoute allowedRoles={["Admin", "Manager"]} />}>
                            <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
                            <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
                        </Route>
                    </Route>

                    {/* ===== CUSTOMER PORTAL ===== */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<RoleProtectedRoute allowedRoles={["Customer"]} />}>
                            <Route element={<CustomerPortalLayout />}>
                                <Route path="/portal" element={<CustomerPortalDashboardPage />} />
                                <Route path="/portal/invoices" element={<CustomerInvoicesPage />} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </Router>
            <SyncStatusWidget />
            <Toaster position="top-right" toastOptions={{
                className: 'bg-secondary/90 text-foreground border border-border backdrop-blur',
            }} />
            </SyncProvider>
        </AuthProvider>
    );
}

export default App;
