import { useState, useEffect, useRef } from "react";
import { Bell, Search, Menu, Sun, Moon, Loader2 } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { useNavigate } from "react-router-dom";
import { searchService, GlobalSearchDto } from "../services/searchService";
import { notificationService, NotificationDto } from "../services/notificationService";
import { useAuth } from "../auth/AuthContext";
import toast from "react-hot-toast";

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const { hasRole } = useAuth();

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GlobalSearchDto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    // Notification State
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Using a ref to click-outside
    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // Click outside handler 
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Notifications
    const fetchNotifications = async () => {
        try {
            const unread = await notificationService.getUnread();
            setNotifications(unread);
            setUnreadCount(unread.length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const intervalId = setInterval(fetchNotifications, 60000);
        return () => clearInterval(intervalId);
    }, []);

    const handleNotificationClick = async (notif: NotificationDto) => {
        try {
            await notificationService.markAsRead(notif.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
            setShowNotifDropdown(false);

            if (notif.type === "Quotation") {
                navigate("/quotations");
            } else if (notif.type === "WorkOrder") {
                navigate("/work-orders");
            }
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setUnreadCount(0);
            setNotifications([]);
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    // Debounced Search Effect
    useEffect(() => {
        const fetchResults = async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                setIsSearching(true);
                const results = await searchService.search(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 400); // 400ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleResultClick = (path: string) => {
        setSearchQuery("");
        setShowDropdown(false);
        navigate(path);
    };

    return (
        <header className="h-16 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 shadow-sm">
            <div className="flex flex-1 items-center space-x-2 md:space-x-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="relative w-48 md:w-96 group" ref={searchRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={hasRole(["Admin", "Manager"]) ? "Search system (Customers, Sites, PR, WO...)" : "Search..."}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full bg-secondary/30 border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner"
                    />
                    
                    {/* Search Dropdown */}
                    {showDropdown && searchQuery.length >= 2 && (
                        <div className="absolute top-full mt-2 w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50">
                            {isSearching ? (
                                <div className="p-4 flex justify-center items-center text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Searching...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="max-h-[350px] overflow-y-auto w-full">
                                    {searchResults.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleResultClick(result.path)}
                                            className="w-full text-left px-4 py-3 hover:bg-secondary/50 border-b border-border/40 last:border-0 transition-colors flex flex-col items-start gap-1"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-semibold text-sm text-foreground">{result.title}</span>
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{result.type}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground line-clamp-1">{result.subtitle}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No results found for "{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-5">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2 rounded-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors group"
                >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                        className="relative p-2 rounded-full hover:bg-secondary/50 transition-colors group"
                    >
                        <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-in zoom-in">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[400px]">
                            <div className="p-4 border-b border-border/40 flex justify-between items-center bg-secondary/20">
                                <h3 className="font-semibold text-foreground">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            
                            <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className="w-full text-left p-3 hover:bg-secondary/50 rounded-lg transition-colors flex flex-col gap-1 relative group"
                                        >
                                            <div className="flex justify-between items-start w-full gap-2">
                                                <span className="font-medium text-sm text-foreground">{notif.title}</span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-8 text-center flex flex-col items-center text-muted-foreground">
                                        <Bell className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-sm">No new notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
