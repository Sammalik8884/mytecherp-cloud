import React, { useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart2, TrendingUp, Activity, PieChart as PieIcon } from 'lucide-react';

export type ChartDataPoint = { name: string; value: number; secondaryValue?: number };
export type ChartType = 'line' | 'bar' | 'area' | 'pie';

interface PremiumChartProps {
    title: string;
    subtitle?: string;
    data: ChartDataPoint[];
    defaultType?: ChartType;
    color?: string;
    secondaryColor?: string;
    allowedTypes?: ChartType[];
    valuePrefix?: string;
    valueSuffix?: string;
    height?: number;
}

const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#fb923c'];

const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card/90 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
            <p className="text-muted-foreground font-medium mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }} className="font-bold">
                    {valuePrefix}{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : p.value}{valueSuffix}
                </p>
            ))}
        </div>
    );
};

const CustomPieTooltip = ({ active, payload, valuePrefix = '', valueSuffix = '' }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
        <div className="bg-card/90 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
            <p className="text-muted-foreground font-medium">{item.name}</p>
            <p style={{ color: item.payload.fill }} className="font-bold text-lg">
                {valuePrefix}{Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}{valueSuffix}
            </p>
        </div>
    );
};

export const PremiumChart: React.FC<PremiumChartProps> = ({
    title, subtitle, data, defaultType = 'area',
    color = '#6366f1',
    allowedTypes = ['line', 'bar', 'area'],
    valuePrefix = '', valueSuffix = '',
    height = 240
}) => {
    const [chartType, setChartType] = useState<ChartType>(defaultType);

    const chartData = data.map(d => ({ name: d.name, value: d.value, secondary: d.secondaryValue }));

    const typeConfig: Record<ChartType, { icon: React.ReactNode; label: string }> = {
        line: { icon: <TrendingUp size={13} />, label: 'Line' },
        bar: { icon: <BarChart2 size={13} />, label: 'Bar' },
        area: { icon: <Activity size={13} />, label: 'Area' },
        pie: { icon: <PieIcon size={13} />, label: 'Pie' },
    };

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 5, right: 10, left: -10, bottom: 0 },
        };
        const xAxis = <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />;
        const yAxis = <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} tickFormatter={(v) => `${valuePrefix}${Number(v).toLocaleString()}`} />;
        const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />;
        const tooltip = <Tooltip content={<CustomTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />;

        if (chartType === 'pie') {
            return (
                <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={height / 2 - 20} innerRadius={height / 2 - 60} paddingAngle={3}>
                        {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
                    <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#9ca3af' }}>{v}</span>} />
                </PieChart>
            );
        }

        if (chartType === 'bar') {
            return (
                <BarChart {...commonProps}>
                    {grid}{xAxis}{yAxis}{tooltip}
                    <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
                </BarChart>
            );
        }

        if (chartType === 'line') {
            return (
                <LineChart {...commonProps}>
                    {grid}{xAxis}{yAxis}{tooltip}
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
            );
        }

        // area (default)
        return (
            <AreaChart {...commonProps}>
                <defs>
                    <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {grid}{xAxis}{yAxis}{tooltip}
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
                    fill={`url(#grad-${title})`}
                    dot={{ fill: color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
        );
    };

    return (
        <div className="bg-card/50 backdrop-blur border border-border/60 rounded-2xl p-5 hover:border-border transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-foreground text-sm">{title}</h3>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex items-center bg-background/80 border border-border rounded-lg p-0.5 space-x-0.5">
                    {allowedTypes.map(t => (
                        <button
                            key={t}
                            onClick={() => setChartType(t)}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
                                ${chartType === t
                                    ? 'bg-primary text-primary-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                }`}
                        >
                            {typeConfig[t].icon}
                            <span className="hidden sm:inline">{typeConfig[t].label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={height}>
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
};
