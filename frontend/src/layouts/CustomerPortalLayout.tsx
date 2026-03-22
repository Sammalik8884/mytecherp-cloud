import { Outlet, NavLink } from "react-router-dom";
import { LogOut, LayoutDashboard, Receipt, Building2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export const CustomerPortalLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-foreground flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 border-b border-border bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-3">
                    <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-foreground tracking-wide">FiretechERP</div>
                        <div className="text-[10px] text-primary/70 uppercase tracking-widest font-medium">Customer Portal</div>
                    </div>
                </div>

                <nav className="hidden md:flex items-center space-x-1">
                    <NavLink
                        to="/portal"
                        end
                        className={({ isActive }) =>
                            `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-primary/20 text-primary" : "text-gray-400 hover:text-white hover:bg-secondary/50"
                            }`
                        }
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink
                        to="/portal/invoices"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-primary/20 text-primary" : "text-gray-400 hover:text-white hover:bg-secondary/50"
                            }`
                        }
                    >
                        <Receipt className="h-4 w-4" />
                        <span>My Invoices</span>
                    </NavLink>
                </nav>

                <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium">{user?.fullName || "Customer"}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                        {user?.fullName?.[0] || "C"}
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/30"
                        title="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Sign out</span>
                    </button>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 px-4 py-8 md:px-8 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-4 text-center text-xs text-gray-600">
                &copy; {new Date().getFullYear()} FiretechERP — Secure Customer Portal
            </footer>
        </div>
    );
};
