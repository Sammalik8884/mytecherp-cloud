import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PremiumChart } from '../components/dashboard/PremiumChart';
import { SystemSetupGuide } from '../components/SystemSetupGuide';
import { apiClient } from '../services/apiClient';
import {
    AlertTriangle, RefreshCw, Calendar, Zap
} from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';

interface ChartDataPoint { name: string; value: number; secondaryValue?: number }
interface DashboardMetrics {
    totalQuotations: number;
    totalQuotationValue: number;
    pendingQuotations: number;
    revenueOverTime: ChartDataPoint[];
    workOrdersByStatus: ChartDataPoint[];
    quotationsByStatus: ChartDataPoint[];
    topCustomersByRevenue: ChartDataPoint[];
    jobsCompletedOverTime: ChartDataPoint[];
    invoiceStatusBreakdown: ChartDataPoint[];
}

const fmt = (n: number) => 
    new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n);

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Date Filtering State
    const [dateRange, setDateRange] = useState<'30days' | '6months' | '1year' | 'all' | 'custom'>('6months');
    const [customStartDate, setCustomStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const fetchMetrics = async () => {
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
                // For all time, pass dates way in the past/future to capture everything
                startDate = '2000-01-01';
                endDate = '2100-01-01';
            }

            const metricsRes = await apiClient.get('/Dashboard/metrics', { params: { startDate, endDate } });
            
            setMetrics(metricsRes.data);
            
            setLastRefresh(new Date());
        } catch (e) {
            console.error('Dashboard fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes('Admin') || user?.roles?.includes('Manager')) {
            fetchMetrics();
        }
    }, [dateRange, user]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    if (!(user?.roles?.includes('Admin') || user?.roles?.includes('Manager'))) {
        return (
            <div className="min-h-screen p-8 animate-in fade-in duration-500">
                <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
                    {greeting},&nbsp;
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400">
                        {user?.fullName?.split(' ')[0] ?? 'User'}
                    </span>
                </h1>
                <p className="text-muted-foreground mt-4 text-lg">Welcome to your dashboard.</p>
                <div className="mt-8">
                    <SystemSetupGuide />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
                        {greeting},&nbsp;
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400">
                            {user?.fullName?.split(' ')[0] ?? 'Admin'}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Global Analytics Command Center
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                    {/* Date Range Selector */}
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
                            <button onClick={fetchMetrics} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90">
                                Apply
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 items-center">
                        <button
                            onClick={fetchMetrics}
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

            {/* System Setup Guide for New Admins */}
            <SystemSetupGuide />

            {loading ? (
                /* ── Skeleton ──────────────────────────────────── */
                <div className="grid gap-6">
                    <div className="h-80 rounded-2xl bg-white/5 animate-pulse border border-border" />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="h-72 rounded-2xl bg-white/5 animate-pulse border border-border" />
                        <div className="h-72 rounded-2xl bg-white/5 animate-pulse border border-border" />
                    </div>
                </div>
            ) : metrics ? (
                <div className="space-y-6">
                    {/* ── Top Focus: Financial Trajectory ───────────────── */}
                    <div className="w-full">
                        <PremiumChart
                            title="Revenue Growth & Financial Trajectory"
                            subtitle={`Historical analysis of paid invoices for selected period`}
                            data={metrics.revenueOverTime}
                            defaultType="area"
                            color="#10b981"
                            allowedTypes={['area', 'bar', 'line']}
                            valuePrefix="$"
                            height={320}
                        />
                    </div>

                    {/* ── Split Level: Pipeline & Customers ─────────────── */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <PremiumChart
                            title="Customer Value Distribution"
                            subtitle="Top 5 highest paying customers (cumulative revenue)"
                            data={metrics.topCustomersByRevenue}
                            defaultType="bar"
                            color="#6366f1"
                            allowedTypes={['bar', 'line', 'pie']}
                            valuePrefix="$"
                            height={300}
                        />
                        <div className="grid gap-6 grid-rows-[2fr_1fr]">
                            <PremiumChart
                                title="Sales Pipeline & Quotation Status"
                                subtitle="Distribution of quotes by stage"
                                data={metrics.quotationsByStatus}
                                defaultType="bar"
                                color="#a855f7"
                                allowedTypes={['bar', 'pie', 'line']}
                                height={200}
                            />
                            {/* Embedded Pipeline Summary within charts area */}
                            <div className="bg-gradient-to-br from-violet-950/40 via-indigo-950/30 to-blue-950/20 border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-violet-400 font-bold mb-1">Total Pipeline Value</p>
                                    <p className="text-4xl font-black text-white">{fmt(metrics.totalQuotationValue)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Pending Quotes</p>
                                    <p className="text-3xl font-bold text-amber-400">{metrics.pendingQuotations}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Lower Split: Operational Status ───────────────── */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <PremiumChart
                            title="Operational Throughput"
                            subtitle="Jobs completed over the selected period"
                            data={metrics.jobsCompletedOverTime}
                            defaultType="area"
                            color="#22d3ee"
                            allowedTypes={['area', 'bar', 'line']}
                            height={260}
                        />
                        <PremiumChart
                            title="Work Order Bottlenecks"
                            subtitle="Current job distribution by status"
                            data={metrics.workOrdersByStatus}
                            defaultType="pie"
                            color="#f59e0b"
                            allowedTypes={['pie', 'bar']}
                            height={260}
                        />
                        <PremiumChart
                            title="Accounts Receivable Health"
                            subtitle="Paid vs Issued vs Overdue invoices"
                            data={metrics.invoiceStatusBreakdown}
                            defaultType="pie"
                            color="#f43f5e"
                            allowedTypes={['pie', 'bar']}
                            height={260}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center bg-card border border-border rounded-xl p-12 text-center h-96 relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
                    <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-inner pointer-events-none">
                        <AlertTriangle size={32} className="text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-3">Advanced Analytics Locked</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                        Get in-depth insights into your financial trajectory, customer value distribution, and operational bottlenecks by upgrading to the Pro plan.
                    </p>
                    <a href="/subscription/plans" className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2">
                        <Zap size={18} />
                        Upgrade to Pro
                    </a>
                </div>
            )}
        </div>
    );
};
