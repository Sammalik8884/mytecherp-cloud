import { useState, useEffect } from 'react';
import { Users, LayoutGrid, Building2, TicketPercent, Wallet, Box, FileText, LayoutDashboard, Truck, Briefcase, FileCheck, CheckCircle2, ChevronRight, AlertCircle, PlayCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const phases = [
    {
        id: 1,
        title: "Foundation",
        description: "Set up the core settings and administrative users for your ERP.",
        icon: <Users className="h-6 w-6" />,
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        steps: [
            { name: "Users & Roles", path: "/users", description: "Create Managers, Admins, and Field Technicians.", icon: <Users className="h-4 w-4" /> },
            { name: "Categories", path: "/categories", description: "Define groups for assets, products, and checklists.", icon: <LayoutGrid className="h-4 w-4" /> },
            { name: "Vendors", path: "/procurement", description: "Add suppliers you purchase inventory from.", icon: <Truck className="h-4 w-4" /> },
            { name: "Warehouses", path: "/inventory", description: "Establish storage locations for your stock.", icon: <Building2 className="h-4 w-4" /> }
        ]
    },
    {
        id: 2,
        title: "CRM & Assets",
        description: "Build your customer database and log their physical equipment.",
        icon: <Building2 className="h-6 w-6" />,
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        steps: [
            { name: "Customers", path: "/customers", description: "Add client companies and contacts.", icon: <Briefcase className="h-4 w-4" /> },
            { name: "Sites", path: "/sites", description: "Link physical locations/buildings to Customers.", icon: <Building2 className="h-4 w-4" /> },
            { name: "Assets", path: "/assets", description: "Log physical equipment (e.g., Extinguishers) to Sites.", icon: <Box className="h-4 w-4" /> }
        ]
    },
    {
        id: 3,
        title: "Inventory",
        description: "Manage your internal stock and catalog of services.",
        icon: <Box className="h-6 w-6" />,
        color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        steps: [
            { name: "Products", path: "/products", description: "Add internal items and services to your catalog.", icon: <Box className="h-4 w-4" /> },
            { name: "Purchase Orders", path: "/procurement", description: "Order products from Vendors to Warehouses.", icon: <FileText className="h-4 w-4" /> },
            { name: "Stock/Transfers", path: "/inventory", description: "Move inventory between your Warehouses.", icon: <PlayCircle className="h-4 w-4" /> }
        ]
    },
    {
        id: 4,
        title: "Operations & Jobs",
        description: "Generate quotes, win contracts, and execute field work.",
        icon: <Briefcase className="h-6 w-6" />,
        color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        steps: [
            { name: "Quotations", path: "/quotations", description: "Quote Products to Customers/Sites.", icon: <FileText className="h-4 w-4" /> },
            { name: "Contracts", path: "/contracts", description: "Setup recurring maintenance agreements.", icon: <FileCheck className="h-4 w-4" /> },
            { name: "Work Orders", path: "/work-orders", description: "Assign jobs (from Quotes/Contracts) to Technicians.", icon: <LayoutDashboard className="h-4 w-4" /> },
            { name: "Checklists", path: "/checklists", description: "Create pass/fail standards for Technicians to fill out.", icon: <CheckCircle2 className="h-4 w-4" /> }
        ]
    },
    {
        id: 5,
        title: "Financials",
        description: "Bill customers and pay your employees.",
        icon: <Wallet className="h-6 w-6" />,
        color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        steps: [
            { name: "Invoices", path: "/invoices", description: "Generate bills from completed Work Orders or Quotes.", icon: <FileText className="h-4 w-4" /> },
            { name: "Payments", path: "/invoices", description: "Log offline Payments or Stripe transactions.", icon: <Wallet className="h-4 w-4" /> },
            { name: "Payroll", path: "/payroll", description: "Pay Technicians based on completed jobs.", icon: <Wallet className="h-4 w-4" /> }
        ]
    }
];

export const SystemSetupGuide = () => {
    const { hasRole, user } = useAuth();
    const [activePhase, setActivePhase] = useState(1);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const hasSeen = localStorage.getItem("hasSeenSetupGuide");
        if (hasSeen === "true") {
            setIsVisible(false);
        }
    }, []);

    // Also hide if they are explicitly not an Admin (don't hide if user is still loading)
    if ((user && !hasRole(["Admin"])) || !isVisible) {
        return null;
    }

    const handleDismiss = () => {
        localStorage.setItem("hasSeenSetupGuide", "true");
        setIsVisible(false);
    };

    return (
        <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm animate-in zoom-in-95 duration-500">
            <div className="p-6 border-b border-border/40 bg-gradient-to-r from-background to-secondary/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <TicketPercent className="h-6 w-6 text-primary" />
                            System Setup & Onboarding Guide
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Follow this strict dependency chain to avoid setup errors. Certain data must exist before others can be created.
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 rounded-xl transition-all font-medium text-sm shadow-sm"
                        title="Dismiss guide permanently"
                    >
                        <span>Dismiss Guide</span>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Phase Navbar */}
                <div className="md:w-1/3 border-r border-border/40 p-4 space-y-2 bg-background/50">
                    {phases.map((phase) => (
                        <button
                            key={phase.id}
                            onClick={() => setActivePhase(phase.id)}
                            className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all ${activePhase === phase.id
                                ? `${phase.color} shadow-sm scale-[1.02]`
                                : 'hover:bg-secondary/50 hover:scale-[1.01] opacity-70 hover:opacity-100'
                                }`}
                        >
                            <div className="mt-1">{phase.icon}</div>
                            <div>
                                <h3 className="font-semibold">Phase {phase.id}: {phase.title}</h3>
                                <p className="text-xs opacity-80 mt-1 line-clamp-2">{phase.description}</p>
                            </div>
                        </button>
                    ))}

                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex gap-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p><strong>Pro Tip:</strong> Always create Base data (e.g., Customers) before Child data (e.g., Sites). Skipping steps will result in missing dropdown options!</p>
                    </div>
                </div>

                {/* Phase Details Content */}
                <div className="md:w-2/3 p-6 sm:p-8 bg-background/80">
                    {phases.map((phase) => (
                        activePhase === phase.id && (
                            <div key={phase.id} className="animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
                                    <div className={`p-3 rounded-lg ${phase.color}`}>
                                        {phase.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Phase {phase.id}: {phase.title}</h3>
                                        <p className="text-muted-foreground">{phase.description}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {phase.steps.map((step, idx) => (
                                        <div key={idx} className="relative pl-8 pb-4">
                                            {/* Connective Line */}
                                            {idx !== phase.steps.length - 1 && (
                                                <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border/50" />
                                            )}

                                            {/* Bullet Node */}
                                            <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center ${phase.color.split(' ')[0]}`}>
                                                <div className="h-2 w-2 rounded-full bg-current" />
                                            </div>

                                            <div className="bg-secondary/40 border border-border/50 p-4 rounded-xl hover:border-primary/50 transition-colors group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-background rounded-md text-foreground group-hover:text-primary transition-colors">
                                                            {step.icon}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Step {idx + 1}: {step.name}</h4>
                                                            <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to={step.path}
                                                        className="hidden sm:flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                                                    >
                                                        Go to {step.name} <ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {activePhase < phases.length && (
                                    <button
                                        onClick={() => setActivePhase(p => p + 1)}
                                        className="mt-8 w-full py-3 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        Proceed to Phase {activePhase + 1} <ChevronRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
};
