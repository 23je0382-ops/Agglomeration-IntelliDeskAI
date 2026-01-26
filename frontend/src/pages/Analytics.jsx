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
    // Categories (Normalized to match badge classes in TicketQueue)
    'technical-support': '#7c3aed', // Purple (neon-cyan)
    'billing-invoice': '#059669',  // Green (neon-green)
    'access-request': '#db2777',   // Pink (neon-pink)
    'feature-request': '#ca8a04',  // Yellow (neon-yellow)
    'hardware-infrastructure': '#ea580c', // Orange (neon-orange)
    'how-to-documentation': '#6d28d9', // Violet (neon-purple)
    'data-request': '#2563eb',     // Blue (neon-blue)
    'complaint-escalation': '#dc2626', // Red (neon-red)
    'general-inquiry': '#2563eb',  // Blue (neon-blue)
    'unknown': '#94a3b8',          // Muted

    // Priorities
    'critical': '#dc2626',         // Red (neon-red)
    'high': '#ea580c',             // Orange (neon-orange)
    'medium': '#ca8a04',           // Yellow (neon-yellow)
    'low': '#059669',              // Green (neon-green)
};

// Helper to normalize category/priority names for color lookup
// Matches logic in TicketQueue.jsx: (ticket.type || 'general').toLowerCase().replace(/[^a-z0-9]/g, '-')
const normalizeKey = (key) => {
    if (!key) return 'unknown';
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return normalized === 'general' ? 'general-inquiry' : normalized;
};

function StatCard({ icon: Icon, label, value, subtext, borderColor }) {
    return (
        <div className="neon-card group hover:shadow-lg transition-shadow bg-[var(--bg-card)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-wider">{label}</p>
                    <p className="text-4xl font-bold mt-3 font-['Orbitron'] text-[var(--text-primary)]">{value}</p>
                    {subtext && <p className="text-sm text-[var(--text-muted)] mt-2">{subtext}</p>}
                </div>
                <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
                    style={{
                        backgroundColor: borderColor.startsWith('var') ? `color-mix(in srgb, ${borderColor} 15%, transparent)` : `${borderColor}15`,
                        border: `1px solid ${borderColor.startsWith('var') ? `color-mix(in srgb, ${borderColor} 30%, transparent)` : `${borderColor}30`}`,
                    }}
                >
                    <Icon className="w-7 h-7" style={{ color: borderColor }} />
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
    })) || [];

    const priorityData = analytics?.tickets_by_priority?.map((item) => {
        const key = normalizeKey(item.category);
        return {
            name: item.category,
            value: item.count,
            fill: COLORS[key] || COLORS.unknown,
        };
    }) || [];

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
                    borderColor="var(--text-primary)"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Open Tickets"
                    value={analytics?.open_tickets || 0}
                    borderColor="#ea580c"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Resolution Rate"
                    value={`${resolutionRate}%`}
                    subtext={`${analytics?.resolved_tickets || 0} resolved`}
                    borderColor="#15803d"
                />
                <StatCard
                    icon={Clock}
                    label="Avg. Resolution"
                    value={analytics?.avg_resolution_time_hours ? `${analytics.avg_resolution_time_hours}h` : 'N/A'}
                    borderColor="#2563eb"
                />
            </div>

            {/* Separator */}
            <div className="h-[1px] bg-[var(--border-color)] mb-8"></div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Tickets by Category */}
                <div className="neon-card">
                    <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--text-primary)] mb-6">Tickets by Category</h2>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={100} fontSize={10} />
                                <Tooltip
                                    cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }}
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#7c3aed" />
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
                    <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--text-primary)] mb-6">Tickets by Priority</h2>
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
                                            backgroundColor: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            color: 'var(--text-primary)'
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
                <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--text-primary)] mb-6">Top Issues</h2>
                {analytics?.top_issues?.length > 0 ? (
                    <div className="space-y-3">
                        {analytics.top_issues.map((issue, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] hover:border-blue-500 transition-colors"
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-['Orbitron']"
                                    style={{
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        border: '1px solid #2563eb',
                                        color: '#2563eb',
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
                        <Zap className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                        <p className="text-[var(--text-muted)]">No issues tracked yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
