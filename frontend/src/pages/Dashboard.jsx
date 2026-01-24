import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Ticket,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    Plus,
    ArrowRight,
    Zap,
} from 'lucide-react';
import { analyticsAPI, ticketsAPI } from '../services/api';

function StatCard({ icon: Icon, label, value, trend, glowColor, borderColor }) {
    return (
        <div className={`neon-card group`} style={{ '--card-glow': glowColor }}>
            {/* Animated top border */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[${borderColor}] to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-wider">{label}</p>
                    <p className="text-4xl font-bold mt-3 font-['Orbitron']" style={{ color: borderColor, textShadow: `0 0 20px ${borderColor}40` }}>{value}</p>
                    {trend && (
                        <p className={`text-sm mt-3 flex items-center gap-1 ${trend > 0 ? 'text-[var(--neon-green)]' : 'text-[var(--neon-red)]'}`}>
                            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                            {Math.abs(trend)}% from last week
                        </p>
                    )}
                </div>
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300`}
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

function RecentTicket({ ticket }) {
    return (
        <Link
            to={`/tickets/${ticket.id}`}
            className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]/50 
                hover:bg-[rgba(0,255,255,0.05)] border border-transparent hover:border-[rgba(0,255,255,0.2)]
                transition-all duration-300 group"
        >
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--neon-cyan)] transition-colors">{ticket.title}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`badge type-${ticket.type}`}>
                        {ticket.type}
                    </span>
                    <span className={`badge priority-${ticket.priority}`}>
                        {ticket.priority}
                    </span>
                </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--neon-cyan)] group-hover:translate-x-1 transition-all" />
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
                <Link
                    to="/create"
                    className="btn-gradient flex items-center gap-2 w-fit"
                >
                    <Plus className="w-5 h-5" />
                    New Ticket
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Ticket}
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
                    label="Resolved"
                    value={analytics?.resolved_tickets || 0}
                    borderColor="var(--neon-green)"
                />
                <StatCard
                    icon={Clock}
                    label="Avg. Resolution"
                    value={analytics?.avg_resolution_time_hours ? `${analytics.avg_resolution_time_hours}h` : 'N/A'}
                    borderColor="var(--neon-pink)"
                />
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tickets */}
                <div className="neon-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-cyan)]">Recent Tickets</h2>
                        <Link to="/tickets" className="text-[var(--neon-pink)] hover:text-[var(--neon-cyan)] text-sm font-semibold flex items-center gap-1 transition-colors group">
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
                                <Zap className="w-12 h-12 mx-auto text-[var(--neon-cyan)] opacity-30 mb-4" />
                                <p className="text-[var(--text-muted)]">No tickets yet</p>
                                <Link to="/create" className="text-[var(--neon-cyan)] text-sm hover:underline mt-2 inline-block">Create your first ticket</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="neon-card">
                    <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-pink)] mb-6">Tickets by Category</h2>
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
                                                    background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-pink))',
                                                    boxShadow: '0 0 10px var(--neon-cyan)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <Zap className="w-12 h-12 mx-auto text-[var(--neon-pink)] opacity-30 mb-4" />
                                <p className="text-[var(--text-muted)]">No data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
