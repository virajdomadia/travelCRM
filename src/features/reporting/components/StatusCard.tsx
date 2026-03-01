import { LucideIcon } from "lucide-react";

interface StatusCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    loading?: boolean;
}

export function StatusCard({ title, value, icon: Icon, description, trend, loading }: StatusCardProps) {
    if (loading) {
        return (
            <div className="bg-[#141b2d] border border-slate-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 w-24 bg-slate-700 rounded mb-4"></div>
                <div className="h-8 w-16 bg-slate-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#141b2d] border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">{title}</span>
                <div className="p-2 bg-slate-800/50 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white">{value}</h3>
                {trend && (
                    <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
            {description && (
                <p className="mt-2 text-xs text-slate-500">{description}</p>
            )}
        </div>
    );
}
