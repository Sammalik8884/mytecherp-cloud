import React, { useEffect, useState } from 'react';
import { expenseApi, ExpenseDto } from '../../api/expenseApi';
import { PremiumChart } from './PremiumChart';
import { Calculator, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

interface ChartDataPoint {
    name: string;
    value: number;
}

const fmt = (n: number) => 
    new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n);

export const ExpenseAuditorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);

    // Metrics
    const [auditStatusData, setAuditStatusData] = useState<ChartDataPoint[]>([]);
    const [officeExpensesData, setOfficeExpensesData] = useState<ChartDataPoint[]>([]);
    const [siteExpensesData, setSiteExpensesData] = useState<ChartDataPoint[]>([]);
    const [employeeExpensesData, setEmployeeExpensesData] = useState<ChartDataPoint[]>([]);
    
    // KPIs
    const [totalOutstanding, setTotalOutstanding] = useState(0);
    const [totalAudited, setTotalAudited] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await expenseApi.getAll();
                setExpenses(data);

                // 1. Audit Status
                let pending = 0;
                let approved = 0;
                let rejected = 0;
                let totalPendingAmt = 0;
                let totalAuditedAmt = 0;

                const officeSums: Record<string, number> = {};
                const siteSums: Record<string, number> = {};
                const employeeSums: Record<string, number> = {};

                data.forEach(e => {
                    const status = e.status || 'Pending';
                    const amt = Number(e.totalExpenseAmount) || 0;

                    if (status === 'Pending') {
                        pending++;
                        totalPendingAmt += amt;
                    } else if (status === 'Approved') {
                        approved++;
                        totalAuditedAmt += amt;
                    } else if (status === 'Rejected') {
                        rejected++;
                        totalAuditedAmt += amt;
                    }

                    // Office
                    if (e.officeName) {
                        officeSums[e.officeName] = (officeSums[e.officeName] || 0) + amt;
                    }

                    // Site
                    if (e.siteName) {
                        siteSums[e.siteName] = (siteSums[e.siteName] || 0) + amt;
                    }

                    // Employee (from items)
                    e.items?.forEach(item => {
                        const empName = item.employeeName || e.createdByEmail || 'Unknown';
                        const itemAmt = Number(item.amount) || 0;
                        employeeSums[empName] = (employeeSums[empName] || 0) + itemAmt;
                    });
                });

                setAuditStatusData([
                    { name: 'Pending', value: pending },
                    { name: 'Approved', value: approved },
                    { name: 'Rejected', value: rejected }
                ].filter(d => d.value > 0));

                setOfficeExpensesData(Object.entries(officeSums)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)); // Top 5

                setSiteExpensesData(Object.entries(siteSums)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)); // Top 5

                setEmployeeExpensesData(Object.entries(employeeSums)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10)); // Top 10

                setTotalOutstanding(totalPendingAmt);
                setTotalAudited(totalAuditedAmt);
                setPendingCount(pending);

            } catch (error) {
                console.error("Failed to load auditor dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-screen p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
                        {greeting},&nbsp;
                        <span className="text-primary font-black">
                            {user?.fullName?.split(' ')[0] ?? 'Auditor'}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Expense Audit Command Center
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6">
                    <div className="h-32 rounded-2xl bg-muted animate-pulse border border-border" />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="h-72 rounded-2xl bg-muted animate-pulse border border-border" />
                        <div className="h-72 rounded-2xl bg-muted animate-pulse border border-border" />
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* KPIs */}
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center elevation-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Pending Audit</p>
                            </div>
                            <p className="text-3xl font-black text-foreground">{pendingCount} Expenses</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center elevation-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                                <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Total Outstanding</p>
                            </div>
                            <p className="text-3xl font-black text-foreground">{fmt(totalOutstanding)}</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center elevation-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                    <CheckSquare size={20} />
                                </div>
                                <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Total Audited</p>
                            </div>
                            <p className="text-3xl font-black text-foreground">{fmt(totalAudited)}</p>
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <PremiumChart
                            title="Audit Status Distribution"
                            subtitle="Breakdown of expenses by audit status"
                            data={auditStatusData}
                            defaultType="pie"
                            color="#1a73e8"
                            allowedTypes={['pie', 'bar']}
                            height={300}
                        />
                        <PremiumChart
                            title="Top Employees by Expense"
                            subtitle="Employees claiming the highest expense amounts"
                            data={employeeExpensesData}
                            defaultType="bar"
                            color="#e81a4f"
                            allowedTypes={['bar', 'line', 'pie']}
                            valuePrefix="Rs "
                            height={300}
                        />
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <PremiumChart
                            title="Expenses by Office"
                            subtitle="Highest outstanding and approved expenses per office"
                            data={officeExpensesData}
                            defaultType="bar"
                            color="#34a853"
                            allowedTypes={['bar', 'pie']}
                            valuePrefix="Rs "
                            height={300}
                        />
                        <PremiumChart
                            title="Expenses by Site"
                            subtitle="Highest outstanding and approved expenses per site"
                            data={siteExpensesData}
                            defaultType="bar"
                            color="#fbbc04"
                            allowedTypes={['bar', 'pie']}
                            valuePrefix="Rs "
                            height={300}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
