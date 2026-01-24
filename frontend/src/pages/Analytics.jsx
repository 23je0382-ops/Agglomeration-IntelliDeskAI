import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { analyticsAPI } from '../services/api';

const COLORS = {
    technical: '#bf00ff',
    billing: '#00ff88',
    account: '#ff00ff',
    general: '#00ffff',
    critical: '#ff0066',
    high: '#ff6600',
    medium: '#ffff00',
    low: '#00ff88',
};

function StatCard({ icon: Icon, label, value, subtext, borderColor }) {
    return (
        <div className="neon-card group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-wider">{label}</p>
                    <p className="text-4xl font-bold mt-3 font-['Orbitron']" style={{ color: borderColor, textShadow: `0 0 20px ${borderColor}40` }}>{value}</p>
                    {subtext && <p className="text-sm text-[var(--text-muted)] mt-2">{subtext}</p>}
                </div>
                <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
                    style={{
                        background: `${borderColor}20`,
                        border: `1px solid ${borderColor}40`,
                        boxShadow: `0 0 20px ${borderColor}30`
                    }}
                >
                    <Icon className="w-7 h-7" style={{ color: borderColor, filter: `drop-shadow(0 0 8px ${borderColor})` }} />
                </div>
            </div>
        </div>
    );
}

export default function Analytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const data = await analyticsAPI.get();
                setAnalytics(data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="fade-in">
                <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text mb-8">Analytics</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="neon-card h-32 flex items-center justify-center">
                            <div className="neon-spinner"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const categoryData = analytics?.tickets_by_category?.map((item) => ({
        name: item.category,
        value: item.count,
        fill: COLORS[item.category] || '#00ffff',
    })) || [];

    const priorityData = analytics?.tickets_by_priority?.map((item) => ({
        name: item.category,
        value: item.count,
        fill: COLORS[item.category] || '#00ffff',
    })) || [];

    const resolutionRate = analytics?.total_tickets
        ? Math.round((analytics.resolved_tickets / analytics.total_tickets) * 100)
        : 0;

    return (
        <div className="fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Analytics</h1>
                <p className="text-[var(--text-muted)] mt-2">Helpdesk performance metrics and insights</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={TrendingUp}
                    label="Total Tickets"
                    value={analytics?.total_tickets || 0}
                    borderColor="var(--neon-cyan)"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Open Tickets"
                    value={analytics?.open_tickets || 0}
                    borderColor="var(--neon-yellow)"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Resolution Rate"
                    value={`${resolutionRate}%`}
                    subtext={`${analytics?.resolved_tickets || 0} resolved`}
                    borderColor="var(--neon-green)"
                />
                <StatCard
                    icon={Clock}
                    label="Avg. Resolution"
                    value={analytics?.avg_resolution_time_hours ? `${analytics.avg_resolution_time_hours}h` : 'N/A'}
                    borderColor="var(--neon-pink)"
                />
            </div>

            {/* Cyber line */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent mb-8"></div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Tickets by Category */}
                <div className="neon-card">
                    <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-cyan)] mb-6">Tickets by Category</h2>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,255,0.1)" />
                                <XAxis type="number" stroke="var(--text-muted)" />
                                <YAxis type="category" dataKey="name" stroke="var(--neon-cyan)" width={80} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--neon-cyan)',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 20px rgba(0,255,255,0.2)',
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-[var(--text-muted)]">
                            <Zap className="w-12 h-12 mb-4 opacity-30" />
                            No data available
                        </div>
                    )}
                </div>

                {/* Tickets by Priority */}
                <div className="neon-card">
                    <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-pink)] mb-6">Tickets by Priority</h2>
                    {priorityData.length > 0 ? (
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={priorityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        stroke="var(--bg-primary)"
                                        strokeWidth={2}
                                    >
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-secondary)',
                                            border: '1px solid var(--neon-pink)',
                                            borderRadius: '12px',
                                            boxShadow: '0 0 20px rgba(255,0,255,0.2)',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-[var(--text-muted)]">
                            <Zap className="w-12 h-12 mb-4 opacity-30" />
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Top Issues */}
            <div className="neon-card">
                <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-purple)] mb-6">Top Issues</h2>
                {analytics?.top_issues?.length > 0 ? (
                    <div className="space-y-3">
                        {analytics.top_issues.map((issue, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[rgba(191,0,255,0.1)] hover:border-[rgba(191,0,255,0.3)] transition-colors"
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-['Orbitron']"
                                    style={{
                                        background: 'rgba(191,0,255,0.2)',
                                        border: '1px solid rgba(191,0,255,0.4)',
                                        color: 'var(--neon-purple)',
                                        textShadow: '0 0 10px var(--neon-purple)'
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <span className="flex-1 capitalize text-[var(--text-secondary)]">{issue}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Zap className="w-12 h-12 mx-auto text-[var(--neon-purple)] opacity-30 mb-4" />
                        <p className="text-[var(--text-muted)]">No issues tracked yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
