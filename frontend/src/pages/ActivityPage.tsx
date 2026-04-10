import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { SalesmanActivityChart } from '../components/dashboard/SalesmanActivityChart';
import { getSalesmanActivityMetrics, downloadSalesActivityPdf, downloadSalesActivityCsv, SalesmanActivityResponse } from '../services/dashboardService';
import { Calendar, RefreshCw, Activity } from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';

export const ActivityPage: React.FC = () => {
    const { user } = useAuth();
    const [salesActivity, setSalesActivity] = useState<SalesmanActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const [dateRange, setDateRange] = useState<'30days' | '6months' | '1year' | 'all' | 'custom'>('6months');
    const [customStartDate, setCustomStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const fetchActivity = async () => {
        try {
            setLoading(true);
            let startDate = '';
            let endDate = '';
            const today = new Date();

            if (dateRange === '30days') {
                startDate = format(subDays(today, 30), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
            } else if (dateRange === '6months') {
                startDate = format(subMonths(today, 6), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
            } else if (dateRange === '1year') {
                startDate = format(subYears(today, 1), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
            } else if (dateRange === 'custom') {
                startDate = customStartDate;
                endDate = customEndDate;
            } else if (dateRange === 'all') {
                startDate = '2000-01-01';
                endDate = '2100-01-01';
            }

            const res = await getSalesmanActivityMetrics(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined
            ).catch(() => null);

            if (res) setSalesActivity(res);
            setLastRefresh(new Date());
        } catch (e) {
            console.error('Activity fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes('Admin') || user?.roles?.includes('Manager')) {
            fetchActivity();
        }
    }, [dateRange, user]);

    return (
        <div className="min-h-screen pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Activity className="h-10 w-10 text-primary" />
                        Salesman Activity
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Managerial Check & Balance for Site Visits.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg p-1">
                        <Calendar size={14} className="text-muted-foreground ml-2 shrink-0" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            className="bg-secondary text-foreground text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer py-1.5 pl-2 pr-6"
                        >
                            <option value="30days">Last 30 Days</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="1year">Last 1 Year</option>
                            <option value="all">All Time</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-secondary/30 border border-border/50 text-sm rounded-lg px-2 py-1.5"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-secondary/30 border border-border/50 text-sm rounded-lg px-2 py-1.5"
                            />
                            <button onClick={fetchActivity} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90">
                                Apply
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => {
                                let sd: Date | undefined;
                                let ed: Date | undefined;
                                if (dateRange !== 'all') {
                                    ed = new Date();
                                    if (dateRange === '30days') sd = subDays(ed, 30);
                                    if (dateRange === '6months') sd = subMonths(ed, 6);
                                    if (dateRange === '1year') sd = subYears(ed, 1);
                                    if (dateRange === 'custom') {
                                        sd = new Date(customStartDate);
                                        ed = new Date(customEndDate);
                                    }
                                }
                                downloadSalesActivityPdf(sd, ed);
                            }}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 px-3 py-1.5 rounded-lg text-sm transition-all"
                        >
                            Export PDF
                        </button>
                        <button
                            onClick={() => {
                                let sd: Date | undefined;
                                let ed: Date | undefined;
                                if (dateRange !== 'all') {
                                    ed = new Date();
                                    if (dateRange === '30days') sd = subDays(ed, 30);
                                    if (dateRange === '6months') sd = subMonths(ed, 6);
                                    if (dateRange === '1year') sd = subYears(ed, 1);
                                    if (dateRange === 'custom') {
                                        sd = new Date(customStartDate);
                                        ed = new Date(customEndDate);
                                    }
                                }
                                downloadSalesActivityCsv(sd, ed);
                            }}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border px-3 py-1.5 rounded-lg text-sm transition-all"
                        >
                            Export CSV
                        </button>
                        
                        <button
                            onClick={fetchActivity}
                            className="flex items-center space-x-2 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border px-3 py-2 rounded-lg transition-all"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                            <span>
                                Refreshed {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-80 rounded-2xl bg-white/5 animate-pulse border border-border" />
            ) : salesActivity ? (
                <div className="w-full">
                    <SalesmanActivityChart salesmenSummary={salesActivity.salesmenSummary} />
                </div>
            ) : null}
        </div>
    );
};
