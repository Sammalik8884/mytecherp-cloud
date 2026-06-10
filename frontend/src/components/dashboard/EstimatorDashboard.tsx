import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { PremiumChart } from './PremiumChart';
import { apiClient } from '../../services/apiClient';
import { Calendar, RefreshCw, FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { Link } from 'react-router-dom';

interface ChartDataPoint { name: string; value: number; secondaryValue?: number }
interface RecentQuotation {
    id: number;
    quotationNumber: string;
    customerName: string;
    grandTotal: number;
    status: string;
    createdAt: string;
}

interface EstimatorMetrics {
    totalQuotations: number;
    totalQuotationValue: number;
    pendingQuotations: number;
    approvedQuotations: number;
    quotationsByStatus: ChartDataPoint[];
    quotationValueOverTime: ChartDataPoint[];
    recentQuotations: RecentQuotation[];
}

const fmt = (n: number) => 
    new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n);

export const EstimatorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<EstimatorMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

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
                startDate = '2000-01-01';
                endDate = '2100-01-01';
            }

            const res = await apiClient.get('/Dashboard/estimator-metrics', { params: { startDate, endDate } });
            setMetrics(res.data);
            setLastRefresh(new Date());
        } catch (e) {
            console.error('Estimator dashboard fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, [dateRange]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-screen pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
                        {greeting},&nbsp;
                        <span className="text-primary font-black">
                            {user?.fullName?.split(' ')[0] ?? 'Estimator'}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Your Personal Quotation Overview
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

            {loading ? (
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse border border-border" />)}
                    </div>
                    <div className="h-80 rounded-2xl bg-muted animate-pulse border border-border" />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="h-72 rounded-2xl bg-muted animate-pulse border border-border" />
                        <div className="h-72 rounded-2xl bg-muted animate-pulse border border-border" />
                    </div>
                </div>
            ) : metrics ? (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-2xl p-5 elevation-1">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-muted-foreground">Total Quotes</p>
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><FileText size={18} /></div>
                            </div>
                            <p className="text-3xl font-black">{metrics.totalQuotations}</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-5 elevation-1">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-muted-foreground">Pipeline Value</p>
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><TrendingUp size={18} /></div>
                            </div>
                            <p className="text-3xl font-black">{fmt(metrics.totalQuotationValue)}</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-5 elevation-1">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-muted-foreground">Pending Quotes</p>
                                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Clock size={18} /></div>
                            </div>
                            <p className="text-3xl font-black">{metrics.pendingQuotations}</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-5 elevation-1">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-muted-foreground">Approved</p>
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><CheckCircle size={18} /></div>
                            </div>
                            <p className="text-3xl font-black">{metrics.approvedQuotations}</p>
                        </div>
                    </div>

                    {/* Chart: Quotation Value Over Time */}
                    <div className="w-full">
                        <PremiumChart
                            title="Your Pipeline Trajectory"
                            subtitle="Total value of quotations generated over time"
                            data={metrics.quotationValueOverTime}
                            defaultType="area"
                            color="#1a73e8"
                            allowedTypes={['area', 'bar', 'line']}
                            valuePrefix="$"
                            height={320}
                        />
                    </div>

                    {/* Lower Split: Status & Recent Quotes */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <PremiumChart
                            title="Quotation Status Breakdown"
                            subtitle="Distribution of your quotes by current status"
                            data={metrics.quotationsByStatus}
                            defaultType="pie"
                            color="#34a853"
                            allowedTypes={['pie', 'bar']}
                            height={320}
                        />
                        
                        <div className="bg-card border border-border rounded-2xl p-6 elevation-2 flex flex-col h-[400px]">
                            <h3 className="text-lg font-bold mb-1">Recent Quotations</h3>
                            <p className="text-sm text-muted-foreground mb-4">Click any quotation to view details</p>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {metrics.recentQuotations.map((quote) => (
                                    <Link 
                                        to={`/quotations/${quote.id}`} 
                                        key={quote.id} 
                                        className="block p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/60 hover:border-primary/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{quote.quotationNumber}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{quote.customerName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{fmt(quote.grandTotal)}</p>
                                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-background border border-border font-medium inline-block mt-1">
                                                    {quote.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {metrics.recentQuotations.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No recent quotations found for the selected period.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
