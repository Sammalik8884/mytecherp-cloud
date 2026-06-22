import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
    Home, Users, MapPin, Briefcase, LogOut, FileText, FolderTree, Package, Receipt,
    Building2,
    ShieldAlert, X, Box, Wrench, DollarSign, FileSignature, ShoppingCart, ClipboardList,
    Activity, RefreshCw, CreditCard, Lock, Target, Car, Wallet, Calculator, CheckSquare
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { PlanFeature } from "../types/auth";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type SidebarItem = {
    label: string;
    href?: string;
    icon?: any;
    paths?: string[];
    allowedRoles?: string[];
    allowedEmails?: string[];
    isHeader?: boolean;
    requiredFeature?: PlanFeature;
    isDropdown?: boolean;
    subItems?: { label: string; action: string; icon: any }[];
};

const SIDEBAR_ITEMS: SidebarItem[] = [
    { label: "Employee Info Form", href: "/hr/employees", paths: ["/hr/employees", "/hr/employees/new", "/hr/employees/edit"], icon: Users, allowedRoles: ["Admin", "Manager", "Site Supervisor", "Accounts Head"] },
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Amount Request Form", href: "/amount-request", icon: DollarSign },
    { label: "Expenses", href: "/expenses", icon: Receipt },
    { label: "Offices", href: "/offices", icon: Building2, allowedRoles: ["Admin", "Manager"] },
    { label: "Projects", href: "/projects", icon: FolderTree, allowedRoles: ["Admin", "Manager"] },
    { 
        label: "Project Documents", 
        href: "/project-documents",
        icon: FileSignature, 
        allowedRoles: ["Admin", "Manager"]
    },

    { label: "Store Management", isHeader: true, allowedRoles: ["Admin", "Procurement Executive"] },
    { label: "Tools Catalog", href: "/store/tools", paths: ["/store/tools"], icon: Package, allowedRoles: ["Admin", "Procurement Executive"] },
    { label: "Site Inventory", href: "/store/inventory", paths: ["/store/inventory"], icon: Warehouse, allowedRoles: ["Admin", "Procurement Executive"] },
    { label: "Daily Store Logs", href: "/store/logs", paths: ["/store/logs", "/store/logs/new"], icon: ClipboardList, allowedRoles: ["Admin", "Procurement Executive"] },

    { label: "Sales & Leads", isHeader: true, allowedRoles: ["Admin", "Manager", "Salesman", "Estimation", "Engineer", "Worker", "Technician"] },
    { label: "Sales Management", href: "/sales/leads", icon: Target, allowedRoles: ["Admin", "Manager", "Salesman", "Engineer", "Worker", "Technician"] },
    { label: "BOQ / Drawings Portal", href: "/sales/boq-portal", icon: FileText, allowedRoles: ["Admin", "Manager", "Estimation"] },
    { label: "Activity (Salesmen)", href: "/sales/activity", icon: Activity, allowedRoles: ["Admin", "Manager"] },
    { label: "My Sales Dashboard", href: "/sales/my-dashboard", icon: MapPin, allowedRoles: ["Admin", "Manager", "Salesman", "Estimation"] },

    { label: "Foundation", isHeader: true, allowedRoles: ["Admin", "Manager", "Engineer", "Salesman", "Estimation", "Accounts Head", "Technician", "Worker"] },
    { label: "Users & Roles", href: "/users", icon: ShieldAlert, allowedRoles: ["Admin", "Manager"] },
    { label: "Application Forms", href: "/application-forms", paths: ["/application-forms", "/application-forms/new"], icon: FileText },
    { label: "Vehicle Travel Forms", href: "/vehicle-travel-forms", paths: ["/vehicle-travel-forms", "/vehicle-travel-forms/new"], icon: Car },

    { label: "CRM & Assets", isHeader: true, allowedRoles: ["Admin", "Manager"] },
    { label: "Clients (CRM)", href: "/customers", icon: Users, paths: ["/customers", "/sites"], allowedRoles: ["Admin", "Manager"] },
    { label: "Assets", href: "/assets", icon: Box, allowedRoles: ["Admin", "Manager"] },

    { label: "Inventory", isHeader: true, allowedRoles: ["Admin", "Manager", "Engineer"] },
    { label: "Catalog (Items)", href: "/products", icon: Package, paths: ["/products", "/categories"], allowedRoles: ["Admin", "Manager", "Engineer"] },
    { label: "Procurement (POs)", href: "/procurement", icon: ShoppingCart, allowedRoles: ["Admin", "Manager"] },
    { label: "Inventory", href: "/inventory", icon: FolderTree, allowedRoles: ["Admin", "Manager"] },
    
    { label: "Procurement Requirements", isHeader: true, allowedRoles: ["Admin", "Manager", "Site Supervisor", "Project Director", "Procurement Head", "Procurement Executive"] },
    { label: "Dashboard", href: "/procurement-flow/dashboard", icon: ClipboardList, allowedRoles: ["Admin", "Manager", "Site Supervisor", "Project Director", "Procurement Head", "Procurement Executive"] },
    { label: "Pending Approvals", href: "/procurement-flow/pending-approvals", icon: ShieldAlert, allowedRoles: ["Admin", "Manager", "Project Director"] },
    { label: "Approved (PD)", href: "/procurement-flow/approved", icon: CheckSquare, allowedRoles: ["Procurement Head"] },
    { label: "Pending Procurements", href: "/procurement-flow/pending-procurements", icon: Activity, allowedRoles: ["Procurement Executive"] },
    { label: "Completed Procurements", href: "/procurement-flow/completed-procurements", icon: CheckSquare, allowedRoles: ["Procurement Executive"] },

    { label: "Operations & Jobs", isHeader: true, allowedRoles: ["Admin", "Manager", "Engineer", "Worker", "Technician", "Estimation"] },
    { label: "Sales & Quotes", href: "/quotations", icon: FileText, paths: ["/quotations", "/quotations/new", "/quotations/edit"], allowedRoles: ["Admin", "Manager", "Engineer", "Estimation"] },
    { label: "Products", href: "/products", icon: Package, allowedRoles: ["None"], allowedEmails: ["m.huzefa@mytecheng.com"] },
    { label: "Contracts & AMCs", href: "/contracts", icon: FileSignature, allowedRoles: ["Admin", "Manager", "Engineer"] },
    { label: "Dispatch (Jobs)", href: "/work-orders", icon: Briefcase, allowedRoles: ["Admin", "Manager"] },
    { label: "My Jobs", href: "/my-jobs", icon: Wrench, paths: ["/my-jobs", "/job/:id"], allowedRoles: ["Admin", "Manager", "Engineer", "Worker", "Technician"] },
    { label: "Checklist Form Builder", href: "/checklists", icon: ClipboardList, allowedRoles: ["Admin", "Manager"], requiredFeature: PlanFeature.ChecklistFormBuilder },

    { label: "Financials", isHeader: true, allowedRoles: ["Admin", "Manager"] },
    { label: "Invoices", href: "/invoices", icon: Receipt, allowedRoles: ["Admin", "Manager"] },
    { label: "HR & Payroll", href: "/payroll", icon: DollarSign, allowedRoles: ["Admin", "Manager"], requiredFeature: PlanFeature.HrPayroll },

    { label: "Accounts Module", isHeader: true, allowedRoles: ["Admin", "Accounts Head", "Manager"] },
    { label: "ARF Dashboard", href: "/accounts/arf-dashboard", icon: Wallet, allowedRoles: ["Admin", "Accounts Head", "Manager"] },
    { label: "Expense Auditor", href: "/accounts/expense-auditor", icon: Calculator, allowedRoles: ["Admin", "Accounts Head", "Manager"], allowedEmails: ["munawar.hasan@mytecheng.com", "shahbaz.ali@mytecheng.com", "faisal.ghani@mytecheng.com"] },

    { label: "System", isHeader: true, allowedRoles: ["Admin", "Manager"] },
    { label: "Audit Logs", href: "/audit-logs", icon: Activity, allowedRoles: ["Admin", "Manager"], requiredFeature: PlanFeature.AuditLogs },
    { label: "Sync Dashboard", href: "/sync-dashboard", icon: RefreshCw, allowedRoles: ["Admin", "Manager"], requiredFeature: PlanFeature.OfflineSync },
    { label: "Billing & Plans", href: "/subscription/plans", icon: CreditCard, allowedRoles: ["Admin", "Manager"] },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { logout, user, hasRole, hasFeature } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

    const toggleDropdown = (label: string) => {
        setOpenDropdowns((prev: Record<string, boolean>) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <div className={cn(
            "fixed md:relative inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border text-foreground w-64 transition-all duration-300 ease-in-out h-full elevation-2 shrink-0",
            isOpen ? "translate-x-0 md:ml-0" : "-translate-x-full md:-ml-64"
        )}>
            <div className="p-5 flex justify-between items-center border-b border-border">
                <div className="flex items-center space-x-3">
                    <img src="/logo.png" alt="MyTechERP Logo" className="h-8 w-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    <span className="text-lg font-bold tracking-tight text-foreground">
                        MyTechERP
                    </span>
                </div>
                <button onClick={onClose} className="md:hidden p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5 relative overflow-y-auto custom-scrollbar">

                {SIDEBAR_ITEMS.map((item, index) => {
                    const isRoleAllowed = !item.allowedRoles || hasRole(item.allowedRoles);
                    const isEmailAllowed = item.allowedEmails && user?.email && item.allowedEmails.includes(user.email.toLowerCase());

                    if (!isRoleAllowed && !isEmailAllowed) {
                        return null;
                    }

                    if (item.isHeader) {
                        return (
                            <div key={`header-${index}`} className="px-4 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                                {item.label}
                            </div>
                        );
                    }

                    let href = item.href as string;
                    if (item.label === "Employee Info Form" && hasRole(["Site Supervisor"]) && !hasRole(["Admin", "Manager", "Accounts Head"])) {
                        href = "/hr/employees/new";
                    }
                    const isActive = location.pathname === href || item.paths?.includes(location.pathname);
                    const isLocked = item.requiredFeature ? !hasFeature(item.requiredFeature) : false;

                    return (
                        <div key={href} className="space-y-1">
                            {isLocked ? (
                                <button
                                    onClick={() => {
                                        if (isOpen) onClose();
                                        navigate("/subscription/plans");
                                    }}
                                    className="w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden group font-medium text-sm text-muted-foreground/50 hover:bg-secondary/20 hover:text-muted-foreground"
                                    title="Upgrade to Pro to unlock this feature"
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon className="h-5 w-5 opacity-50" />
                                        <span>{item.label}</span>
                                    </div>
                                    <div className="bg-background/80 p-1 rounded backdrop-blur-sm border border-border/50">
                                        <Lock className="h-3 w-3 text-amber-500/70" />
                                    </div>
                                </button>
                            ) : item.isDropdown ? (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleDropdown(item.label);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden group font-medium text-sm",
                                        openDropdowns[item.label]
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </div>
                                </button>
                            ) : (
                                <NavLink
                                    to={href}
                                    onClick={() => { if (isOpen) onClose(); }}
                                    className={cn(
                                        "flex items-center justify-between space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden group font-medium text-sm",
                                        isActive
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </div>
                                </NavLink>
                            )}

                            {/* Custom SubItems Dropdown */}
                            {!isLocked && item.isDropdown && openDropdowns[item.label] && item.subItems && (
                                <div className="pl-12 flex flex-col space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                                    {item.subItems.map((sub, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent(sub.action));
                                                if (isOpen) onClose();
                                            }}
                                            className="text-xs py-2 px-2 rounded-md transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 text-left w-full"
                                        >
                                            <sub.icon className="h-3 w-3" />
                                            <span>{sub.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Submenu for Catalog */}
                            {!isLocked && item.label === "Catalog (Items)" && isActive && (
                                <div className="pl-12 flex flex-col space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                                    <NavLink
                                        to="/products"
                                        className={({ isActive }) => cn(
                                            "text-xs py-2 px-2 rounded-md transition-colors flex items-center space-x-2",
                                            isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        <Package className="h-3 w-3" />
                                        <span>Items & Services</span>
                                    </NavLink>
                                    <NavLink
                                        to="/categories"
                                        className={({ isActive }) => cn(
                                            "text-xs py-2 px-2 rounded-md transition-colors flex items-center space-x-2",
                                            isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        <FolderTree className="h-3 w-3" />
                                        <span>Categories</span>
                                    </NavLink>
                                </div>
                            )}
                            {/* Submenu for CRM */}
                            {!isLocked && item.label === "Clients (CRM)" && isActive && (
                                <div className="pl-12 flex flex-col space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                                    <NavLink
                                        to="/customers"
                                        className={({ isActive }) => cn(
                                            "text-xs py-2 px-2 rounded-md transition-colors",
                                            isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        Client List
                                    </NavLink>
                                    <NavLink
                                        to="/sites"
                                        className={({ isActive }) => cn(
                                            "text-xs py-2 px-2 rounded-md transition-colors flex items-center space-x-2",
                                            isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        <MapPin className="h-3 w-3" />
                                        <span>Sites & Locations</span>
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center space-x-3 mb-3 px-1">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-sm">
                            {user?.fullName?.[0] || 'U'}
                        </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">{user?.fullName || 'User'}</span>
                        <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-all duration-200 text-sm font-medium"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                </button>
            </div>
        </div>
    );
};
