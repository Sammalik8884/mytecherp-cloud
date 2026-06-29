import { useState, useEffect } from "react";
import { Loader2, Activity, User, Calendar } from "lucide-react";
import { activityService, ActivityDto, ActivityStatsDto } from "../services/activityService";
import { authService } from "../services/authService";

interface UserDto {
    id: string;
    firstName: string;
    lastName: string;
}
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { toast } from "react-hot-toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899'];

export const ActivityMonitoringPage = () => {
    const [activities, setActivities] = useState<ActivityDto[]>([]);
    const [stats, setStats] = useState<ActivityStatsDto | null>(null);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [period, setPeriod] = useState<string>("today"); // today, week, month, year, custom
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        handlePeriodChange(period);
    }, [period]);

    useEffect(() => {
        if (startDate && endDate) {
            loadData();
        }
    }, [selectedUserId, startDate, endDate]);

    const loadUsers = async () => {
        try {
            const data = await authService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const dataRes = await activityService.getActivities(selectedUserId, startDate, endDate, 1, 100);
            setActivities(dataRes.data);
            
            const statsRes = await activityService.getActivityStats(selectedUserId, startDate, endDate);
            setStats(statsRes);
        } catch (error) {
            toast.error("Failed to load activity logs");
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (val: string) => {
        setPeriod(val);
        const today = new Date();
        let start = today;
        let end = today;

        if (val === 'today') {
            // keep today
        } else if (val === 'week') {
            start = startOfWeek(today);
        } else if (val === 'month') {
            start = startOfMonth(today);
        } else if (val === 'year') {
            start = startOfYear(today);
        } else if (val === 'custom') {
            return;
        }
        
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    };

    const formatDataForBarChart = () => {
        if (!stats) return [];
        return Object.keys(stats.activitiesByDate).map(date => ({
            date,
            count: stats.activitiesByDate[date]
        }));
    };

    const formatDataForPieChart = () => {
        if (!stats) return [];
        return Object.keys(stats.activitiesByAction).map(action => ({
            name: action,
            value: stats.activitiesByAction[action]
        }));
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" />
                        Activity Monitoring
                    </h1>
                    <p className="text-muted-foreground mt-1">Track and monitor all user actions across the system</p>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 border-r border-border pr-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <select 
                            className="bg-transparent text-sm font-medium focus:outline-none"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                        >
                            <option value="">All Employees</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 border-r border-border pr-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <select 
                            className="bg-transparent text-sm font-medium focus:outline-none"
                            value={period}
                            onChange={e => handlePeriodChange(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Date</option>
                        </select>
                    </div>

                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                className="bg-transparent text-sm font-medium focus:outline-none"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                            <span className="text-muted-foreground">to</span>
                            <input 
                                type="date" 
                                className="bg-transparent text-sm font-medium focus:outline-none"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Stats & Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Activity Volume</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={formatDataForBarChart()}>
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `${val}`} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="count" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Actions Breakdown</h3>
                            <div className="h-64 flex flex-col items-center justify-center relative">
                                {formatDataForPieChart().length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={formatDataForPieChart()}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {formatDataForPieChart().map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-3xl font-bold">{stats?.totalActivities || 0}</span>
                                            <span className="text-xs text-muted-foreground uppercase">Total</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">No activities found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Table */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border">
                            <h3 className="text-lg font-semibold">Detailed Activity Log</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Action</th>
                                        <th className="px-6 py-4 font-semibold">Module / Entity</th>
                                        <th className="px-6 py-4 font-semibold">Time</th>
                                        <th className="px-6 py-4 font-semibold text-right">Changes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.map(activity => (
                                        <tr key={activity.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {activity.userName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-foreground">{activity.userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    activity.action === 'Added' ? 'bg-emerald-500/10 text-emerald-600' :
                                                    activity.action === 'Modified' ? 'bg-amber-500/10 text-amber-600' :
                                                    'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                    {activity.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{activity.entityName}</div>
                                                <div className="text-xs text-muted-foreground">ID: {activity.entityId}</div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                                                    disabled={!activity.oldValue && !activity.newValue}
                                                    onClick={() => {
                                                        alert(`Old Value:\n${activity.oldValue}\n\nNew Value:\n${activity.newValue}`);
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activities.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                No activities recorded for this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
