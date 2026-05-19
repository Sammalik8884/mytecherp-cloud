import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TrialBanner, TrialExpiredWall, useTrialEnforcement } from "../components/TrialBanner";

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const isTrialExpired = useTrialEnforcement();

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Blocking wall for expired trials */}
            {isTrialExpired && <TrialExpiredWall />}

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <TrialBanner />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar bg-background">
                    <div className="animate-fade-in max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

