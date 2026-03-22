import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    href?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    accentColor?: string;
}

const lightColors: Record<string, { bg: string; iconBg: string; iconColor: string; border: string }> = {
    blue:    { bg: 'from-blue-50/80 to-white',    iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    border: 'border-blue-200/60 hover:border-blue-300' },
    emerald: { bg: 'from-emerald-50/80 to-white',  iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-200/60 hover:border-emerald-300' },
    amber:   { bg: 'from-amber-50/80 to-white',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   border: 'border-amber-200/60 hover:border-amber-300' },
    rose:    { bg: 'from-rose-50/80 to-white',    iconBg: 'bg-rose-100',    iconColor: 'text-rose-600',    border: 'border-rose-200/60 hover:border-rose-300' },
    violet:  { bg: 'from-violet-50/80 to-white',  iconBg: 'bg-violet-100',  iconColor: 'text-violet-600',  border: 'border-violet-200/60 hover:border-violet-300' },
    cyan:    { bg: 'from-cyan-50/80 to-white',    iconBg: 'bg-cyan-100',    iconColor: 'text-cyan-600',    border: 'border-cyan-200/60 hover:border-cyan-300' },
    orange:  { bg: 'from-orange-50/80 to-white',  iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',  border: 'border-orange-200/60 hover:border-orange-300' },
};

const darkColors: Record<string, { bg: string; iconBg: string; iconColor: string; border: string; accentBorder: string }> = {
    blue:    { bg: 'bg-card',  iconBg: 'bg-blue-500/15',    iconColor: 'text-blue-400',    border: 'border-border/50 hover:border-blue-500/40',    accentBorder: 'border-l-blue-500' },
    emerald: { bg: 'bg-card',  iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', border: 'border-border/50 hover:border-emerald-500/40', accentBorder: 'border-l-emerald-500' },
    amber:   { bg: 'bg-card',  iconBg: 'bg-amber-500/15',   iconColor: 'text-amber-400',   border: 'border-border/50 hover:border-amber-500/40',   accentBorder: 'border-l-amber-500' },
    rose:    { bg: 'bg-card',  iconBg: 'bg-rose-500/15',    iconColor: 'text-rose-400',    border: 'border-border/50 hover:border-rose-500/40',    accentBorder: 'border-l-rose-500' },
    violet:  { bg: 'bg-card',  iconBg: 'bg-violet-500/15',  iconColor: 'text-violet-400',  border: 'border-border/50 hover:border-violet-500/40',  accentBorder: 'border-l-violet-500' },
    cyan:    { bg: 'bg-card',  iconBg: 'bg-cyan-500/15',    iconColor: 'text-cyan-400',    border: 'border-border/50 hover:border-cyan-500/40',    accentBorder: 'border-l-cyan-500' },
    orange:  { bg: 'bg-card',  iconBg: 'bg-orange-500/15',  iconColor: 'text-orange-400',  border: 'border-border/50 hover:border-orange-500/40',  accentBorder: 'border-l-orange-500' },
};

export const StatCard: React.FC<StatCardProps> = ({
    title, value, subtitle, icon: Icon, href, trend, trendLabel, accentColor = 'blue'
}) => {
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Determine effective theme (handle "system" preference)
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const lc = lightColors[accentColor] || lightColors.blue;
    const dc = darkColors[accentColor] || darkColors.blue;

    const handleClick = () => { if (href) navigate(href); };

    if (isDark) {
        return (
            <div
                onClick={handleClick}
                className={`
                    relative group overflow-hidden rounded-2xl p-5 border-l-4 ${dc.accentBorder}
                    ${dc.bg} border ${dc.border}
                    shadow-lg shadow-black/20
                    transition-all duration-300 ease-out
                    ${href ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]' : ''}
                    animate-slide-up
                `}
            >
                <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
                        <p className={`font-extrabold text-foreground leading-none truncate ${String(value).length > 10 ? 'text-xl' : String(value).length > 7 ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
                        {subtitle && <p className="mt-1.5 text-xs text-muted-foreground truncate">{subtitle}</p>}
                        {trend && trendLabel && (
                            <div className={`mt-3 inline-flex items-center space-x-1.5 text-xs font-semibold px-2 py-1 rounded-full
                                ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-muted text-muted-foreground'}`}>
                                {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
                                <span>{trendLabel}</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${dc.iconBg} ml-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`h-6 w-6 ${dc.iconColor}`} />
                    </div>
                </div>
                {href && (
                    <div className="absolute bottom-4 right-5 text-[10px] text-muted-foreground/40 font-medium group-hover:text-muted-foreground transition-colors tracking-wide">
                        View details →
                    </div>
                )}
            </div>
        );
    }

    // Light mode
    return (
        <div
            onClick={handleClick}
            className={`
                relative group overflow-hidden rounded-2xl p-5
                bg-gradient-to-br ${lc.bg}
                border ${lc.border}
                shadow-sm hover:shadow-lg
                transition-all duration-300 ease-out
                ${href ? 'cursor-pointer hover:-translate-y-1 hover:scale-[1.01]' : ''}
                animate-slide-up
            `}
        >
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
                    <p className={`font-extrabold text-foreground leading-none truncate ${String(value).length > 10 ? 'text-xl' : String(value).length > 7 ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
                    {subtitle && <p className="mt-1.5 text-xs text-muted-foreground truncate">{subtitle}</p>}
                    {trend && trendLabel && (
                        <div className={`mt-3 inline-flex items-center space-x-1.5 text-xs font-semibold px-2 py-1 rounded-full
                            ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : trend === 'down' ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground'}`}>
                            {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
                            <span>{trendLabel}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${lc.iconBg} ml-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${lc.iconColor}`} />
                </div>
            </div>
            {href && (
                <div className="absolute bottom-4 right-5 text-[10px] text-muted-foreground/40 font-medium group-hover:text-muted-foreground transition-colors tracking-wide">
                    View details →
                </div>
            )}
        </div>
    );
};
