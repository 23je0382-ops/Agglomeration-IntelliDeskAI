import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Ticket,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,

    ArrowRight,
    Zap,
} from 'lucide-react';
import { analyticsAPI, ticketsAPI } from '../services/api';

function StatCard({ icon: Icon, label, value, trend, glowColor, borderColor }) {
    return (
        <div className={`neon-card group`} style={{ '--card-glow': glowColor }}>
            <div className="flex items-start justify-between">
                <div
                    className="flex flex-col gap-2"
                >
                    <p className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-wider">{label}</p>
                    <p className="text-4xl font-bold mt-1 font-['Orbitron']" style={{
                        color: borderColor,
                    }}>{value}</p>
                    {trend && (
                        <p className={`text-sm mt-1 flex items-center gap-1 ${trend > 0 ? 'text-[var(--neon-green)]' : 'text-[var(--neon-red)]'}`}>
                            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                            {Math.abs(trend)}% from last week
                        </p>
                    )}
                </div>
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300`}
                    style={{
                        background: borderColor.startsWith('var') ? `color-mix(in srgb, ${borderColor} 10%, transparent)` : `${borderColor}10`,
                        border: `1px solid ${borderColor.startsWith('var') ? `color-mix(in srgb, ${borderColor} 30%, transparent)` : `${borderColor}30`}`,
                    }}
                >
                    <Icon className="w-7 h-7" style={{ color: borderColor }} />
                </div>
            </div>
        </div>
    );
}

function RecentTicket({ ticket }) {
    return (
        <Link
            to={`/tickets/${ticket.id}`}
            className="flex items-center justify-between p-4 rounded-3xl bg-[var(--bg-tertiary)]/50 
                hover:bg-[rgba(0,255,255,0.05)] border border-transparent hover:border-[rgba(0,255,255,0.2)]
                transition-all duration-300 group"
        >
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text-primary)] truncate group-hover:text-blue-600 transition-colors">{ticket.title}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`badge type-${(ticket.type || 'general').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        {ticket.type}
                    </span>
                    <span className={`badge priority-${ticket.priority}`}>
                        {ticket.priority}
                    </span>
                    {ticket.confidence_score && (
                        <span className={`badge border ${ticket.confidence_score > 0.8 ? 'border-green-600 text-green-700' :
                            ticket.confidence_score > 0.5 ? 'border-orange-500 text-orange-700' :
                                'border-red-500 text-red-700'
                            }`}>
                            {Math.round(ticket.confidence_score * 100)}%
                        </span>
                    )}
                </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>
    );
}

export default function Dashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [analyticsData, ticketsData] = await Promise.all([
                    analyticsAPI.get(),
                    ticketsAPI.getAll({ limit: 5 }),
                ]);
                setAnalytics(analyticsData);
                setRecentTickets(ticketsData.slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="fade-in">
                <h1 className="text-3xl font-bold mb-8 font-['Orbitron'] gradient-text">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="neon-card h-36 flex items-center justify-center">
                            <div className="neon-spinner"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Dashboard</h1>
                    <p className="text-[var(--text-muted)] mt-2">Welcome back! Here's your helpdesk overview.</p>
                </div>
            </div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Ticket}
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
                    label="Resolved"
                    value={analytics?.resolved_tickets || 0}
                    borderColor="#15803d"
                />
                <StatCard
                    icon={Clock}
                    label="Avg. Resolution"
                    value={analytics?.avg_resolution_time_hours ? `${Math.round(analytics.avg_resolution_time_hours * 60)}m` : 'N/A'}
                    borderColor="#2563eb"
                />
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tickets */}
                <div className="neon-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--text-primary)]">Recent Tickets</h2>
                        <Link to="/tickets" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-semibold flex items-center gap-1 transition-colors group">
                            View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentTickets.length > 0 ? (
                            recentTickets.map((ticket) => (
                                <RecentTicket key={ticket.id} ticket={ticket} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Zap className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                                <p className="text-[var(--text-muted)]">No tickets yet</p>
                                <Link to="/create" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Create your first ticket</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="neon-card">
                    <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--text-primary)] mb-6">Tickets by Category</h2>
                    <div className="space-y-5">
                        {analytics?.tickets_by_category?.length > 0 ? (
                            analytics.tickets_by_category.map(({ category, count }) => {
                                const total = analytics.total_tickets || 1;
                                const percentage = Math.round((count / total) * 100);
                                return (
                                    <div key={category}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`badge type-${category}`}>
                                                {category}
                                            </span>
                                            <span className="text-sm text-[var(--text-secondary)] font-semibold">{count} <span className="text-[var(--text-muted)]">({percentage}%)</span></span>
                                        </div>
                                        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out"
                                                style={{
                                                    width: `${percentage}%`,
                                                    background: '#2563eb',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <Zap className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                                <p className="text-[var(--text-muted)]">No data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
