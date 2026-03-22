import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TrialBanner, TrialExpiredWall, useTrialEnforcement } from "../components/TrialBanner";

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isTrialExpired = useTrialEnforcement();

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
            {/* Blocking wall for expired trials */}
            {isTrialExpired && <TrialExpiredWall />}

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                {/* Futuristic Background accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4" />

                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <TrialBanner />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
