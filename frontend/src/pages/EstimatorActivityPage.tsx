import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { EstimatorActivityChart } from '../components/dashboard/EstimatorActivityChart';
import { getEstimatorsActivity, EstimatorActivityResponse } from '../services/dashboardService';
import { quotationService } from '../services/quotationService';
import { Calendar, RefreshCw, Activity, FileText, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';

export const EstimatorActivityPage: React.FC = () => {
    const { user } = useAuth();
    const [activity, setActivity] = useState<EstimatorActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const [dateRange, setDateRange] = useState<'30days' | '6months' | '1year' | 'all' | 'custom'>('6months');
    const [customStartDate, setCustomStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [estimatorId, setEstimatorId] = useState<string>('');
    const [estimators, setEstimators] = useState<any[]>([]);

    const [selectedQuoteDetails, setSelectedQuoteDetails] = useState<any>(null);
    const [isQuoteLoading, setIsQuoteLoading] = useState(false);

    const handleViewQuoteDetails = async (quoteId: number) => {
        setIsQuoteLoading(true);
        setSelectedQuoteDetails({ loading: true });
        try {
            const data = await quotationService.getQuotationById(quoteId);
            setSelectedQuoteDetails(data);
        } catch (err) {
            toast.error("Failed to load quote details");
            setSelectedQuoteDetails(null);
        } finally {
            setIsQuoteLoading(false);
        }
    };

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

            const res = await getEstimatorsActivity(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined,
                estimatorId || undefined
            ).catch(() => null);

            if (res) setActivity(res);
            setLastRefresh(new Date());
        } catch (e) {
            console.error('Activity fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const authService = (await import('../services/authService')).authService;
            const usersData = await authService.getUsers().catch(() => []);
            setEstimators(usersData.filter((u: any) => u.roles?.includes('Estimation') || u.roles?.includes('Estimator')));
        } catch (e) {
            console.error('Filter fetch failed', e);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes('Admin') || user?.roles?.includes('Manager')) {
            fetchFilters();
        }
    }, [user]);

    useEffect(() => {
        if (user?.roles?.includes('Admin') || user?.roles?.includes('Manager')) {
            fetchActivity();
        }
    }, [dateRange, estimatorId, user]);

    // Aggregate overall metrics for the top ribbon
    const totalAssigned = activity?.estimatorsSummary.reduce((acc, curr) => acc + curr.assignedQuotesCount, 0) || 0;
    const totalMade = activity?.estimatorsSummary.reduce((acc, curr) => acc + curr.madeQuotesCount, 0) || 0;
    const totalPending = activity?.estimatorsSummary.reduce((acc, curr) => acc + curr.pendingQuotesCount, 0) || 0;
    const totalApproved = activity?.estimatorsSummary.reduce((acc, curr) => acc + curr.approvedQuotesCount, 0) || 0;

    return (
        <div className="min-h-screen pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Activity className="h-10 w-10 text-primary" />
                        Estimator Activity
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Monitoring quote assignments, creation, and line items breakdown.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg p-1">
                        <select
                            value={estimatorId}
                            onChange={(e) => setEstimatorId(e.target.value)}
                            className="bg-secondary text-foreground text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer py-1.5 px-2"
                        >
                            <option value="">All Estimators</option>
                            {estimators.map(s => (
                                <option key={s.id} value={s.id}>{s.fullName}</option>
                            ))}
                        </select>
                    </div>

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

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-muted-foreground font-medium text-sm">Assigned Quotes</h3>
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <FileText size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{loading ? '-' : totalAssigned}</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-muted-foreground font-medium text-sm">Made Quotes</h3>
                        <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                            <CheckCircle size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{loading ? '-' : totalMade}</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-muted-foreground font-medium text-sm">Pending Quotes</h3>
                        <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{loading ? '-' : totalPending}</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-muted-foreground font-medium text-sm">Approved Quotes</h3>
                        <div className="bg-teal-500/10 p-2 rounded-lg text-teal-500">
                            <CheckCircle size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{loading ? '-' : totalApproved}</div>
                </div>
            </div>

            {loading ? (
                <div className="h-80 rounded-2xl bg-secondary/30 animate-pulse border border-border" />
            ) : activity ? (
                <div className="space-y-8">
                    <EstimatorActivityChart estimatorsSummary={activity.estimatorsSummary} />

                    <div className="space-y-6">
                        {activity.estimatorsSummary.map(summary => (
                            <div key={summary.estimatorId} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-border bg-secondary/10 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold">{summary.estimatorName}</h2>
                                            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                                {summary.assignedQuotesCount > 0 ? Math.round((summary.madeQuotesCount / summary.assignedQuotesCount) * 100) : 0}% Completion
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground text-sm flex gap-4 mt-2">
                                            <span>Assigned: {summary.assignedQuotesCount}</span>
                                            <span>Made: {summary.madeQuotesCount}</span>
                                            <span>Pending: {summary.pendingQuotesCount}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Local</div>
                                            <div className="font-bold text-sm text-blue-500">S: {summary.localSupplyLines} | I: {summary.localInstallLines}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Imported</div>
                                            <div className="font-bold text-sm text-emerald-500">S: {summary.importedSupplyLines} | I: {summary.importedInstallLines}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground bg-secondary/30 uppercase border-b border-border">
                                            <tr>
                                                <th className="px-6 py-4">Quote #</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Total Lines</th>
                                                <th className="px-6 py-4">Loc. Supply</th>
                                                <th className="px-6 py-4">Imp. Supply</th>
                                                <th className="px-6 py-4">Loc. Install</th>
                                                <th className="px-6 py-4">Imp. Install</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.quoteActivityDetails.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                                        No quotes created in this period.
                                                    </td>
                                                </tr>
                                            ) : summary.quoteActivityDetails.map(q => (
                                                <tr key={q.quoteId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                                    <td className="px-6 py-4 font-medium">
                                                        <button 
                                                            onClick={() => handleViewQuoteDetails(q.quoteId)}
                                                            className="text-primary hover:underline font-semibold focus:outline-none"
                                                            title="View Details"
                                                        >
                                                            {q.quoteNumber}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${q.status === 'Approved' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                                                            {q.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">{q.totalLineItems}</td>
                                                    <td className="px-6 py-4">{q.localSupplyLines}</td>
                                                    <td className="px-6 py-4">{q.importedSupplyLines}</td>
                                                    <td className="px-6 py-4">{q.localInstallLines}</td>
                                                    <td className="px-6 py-4">{q.importedInstallLines}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Quote Details Modal */}
            {selectedQuoteDetails && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/10 shrink-0">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                <FileText className="h-5 w-5 text-primary" />
                                {selectedQuoteDetails.loading ? "Loading Details..." : selectedQuoteDetails.quoteNumber}
                            </h3>
                            <button 
                                onClick={() => setSelectedQuoteDetails(null)} 
                                className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {isQuoteLoading || selectedQuoteDetails.loading ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground animate-pulse">Fetching details...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Client Name</div>
                                            <div className="font-medium">{selectedQuoteDetails.customerName}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Status</div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                selectedQuoteDetails.status === 'Approved' ? 'bg-green-500/15 text-green-600' : 
                                                selectedQuoteDetails.status === 'InProgress' ? 'bg-amber-500/15 text-amber-600' :
                                                'bg-secondary text-muted-foreground border border-border/50'
                                            }`}>
                                                {selectedQuoteDetails.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Assigned Date</div>
                                            <div className="font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary/70" />
                                                {format(new Date(selectedQuoteDetails.createdAt), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Revision History</div>
                                            <div className="font-medium flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4 text-primary/70" />
                                                Revision {selectedQuoteDetails.revisionNumber}
                                            </div>
                                            {selectedQuoteDetails.parentQuoteId && (
                                                <div className="text-xs text-muted-foreground mt-1">Has Parent Quote</div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedQuoteDetails.quoteHeadline && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                            <div className="text-xs text-primary mb-1 uppercase tracking-wider font-semibold">Headline / Subject</div>
                                            <div className="font-medium text-sm">{selectedQuoteDetails.quoteHeadline}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t border-border bg-muted/20 shrink-0 flex justify-end">
                            <button
                                onClick={() => setSelectedQuoteDetails(null)}
                                className="px-6 py-2 rounded-xl border border-border hover:bg-secondary/80 font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EstimatorActivityPage;
