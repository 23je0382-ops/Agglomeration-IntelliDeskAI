import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ArrowRight, Clock, Zap } from 'lucide-react';
import { ticketsAPI } from '../services/api';

const statusOptions = ['all', 'open', 'in_progress', 'resolved', 'closed'];
const typeOptions = [
    'all',
    'Technical Support',
    'Access Request',
    'Billing/Invoice',
    'Feature Request',
    'Hardware/Infrastructure',
    'How-To/Documentation',
    'Data Request',
    'Complaint/Escalation',
    'General Inquiry'
];
const priorityOptions = ['all', 'critical', 'high', 'medium', 'low'];

function TicketCard({ ticket }) {
    const createdAt = new Date(ticket.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Link
            to={`/tickets/${ticket.id}`}
            className="block neon-card group"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-[var(--neon-cyan)] font-mono">#{ticket.id}</span>
                        <span className={`badge status-${ticket.status}`}>
                            {ticket.status.replace('_', ' ')}
                        </span>
                    </div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] truncate group-hover:text-[var(--neon-cyan)] transition-colors">{ticket.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-3 mt-4">
                        <span className={`badge type-${(ticket.type || 'general').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                            {ticket.type}
                        </span>
                        <span className={`badge priority-${ticket.priority}`}>
                            {ticket.priority}
                        </span>
                        {ticket.confidence_score && (
                            <span className={`badge border ${ticket.confidence_score > 0.8 ? 'border-[var(--neon-green)] text-[var(--neon-green)]' :
                                ticket.confidence_score > 0.5 ? 'border-[var(--neon-yellow)] text-[var(--neon-yellow)]' :
                                    'border-[var(--neon-red)] text-[var(--neon-red)]'
                                } flex items-center gap-1`}>
                                <Zap className="w-3 h-3" />
                                {Math.round(ticket.confidence_score * 100)}%
                            </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            {createdAt}
                        </span>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-6 group-hover:text-[var(--neon-cyan)] group-hover:translate-x-1 transition-all" />
            </div>
        </Link>
    );
}

export default function TicketQueue() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        priority: 'all',
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchTickets() {
            setLoading(true);
            try {
                const params = {};
                if (filters.status !== 'all') params.status = filters.status;
                if (filters.type !== 'all') params.type = filters.type;
                if (filters.priority !== 'all') params.priority = filters.priority;

                const data = await ticketsAPI.getAll(params);
                setTickets(data);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchTickets();
    }, [filters]);

    const filteredTickets = tickets.filter((ticket) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            ticket.title.toLowerCase().includes(query) ||
            ticket.description.toLowerCase().includes(query) ||
            ticket.id.toString().includes(query)
        );
    });

    return (
        <div className="fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Ticket Queue</h1>
                    <p className="text-[var(--text-muted)] mt-2">
                        <span className="text-[var(--neon-cyan)]">{filteredTickets.length}</span> ticket{filteredTickets.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 min-w-[240px]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-cyan)]" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="neon-input pl-12"
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="neon-input appearance-none pr-10 cursor-pointer min-w-[160px]"
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                Status: {opt === 'all' ? 'All' : opt.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neon-cyan)] pointer-events-none" />
                </div>

                {/* Type Filter */}
                <div className="relative">
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="neon-input appearance-none pr-10 cursor-pointer min-w-[140px]"
                    >
                        {typeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                Type: {opt === 'all' ? 'All' : opt}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neon-cyan)] pointer-events-none" />
                </div>

                {/* Priority Filter */}
                <div className="relative">
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="neon-input appearance-none pr-10 cursor-pointer min-w-[150px]"
                    >
                        {priorityOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                Priority: {opt === 'all' ? 'All' : opt}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neon-cyan)] pointer-events-none" />
                </div>
            </div>

            {/* Cyber line */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent mb-6"></div>

            {/* Ticket List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="neon-card h-32 flex items-center justify-center">
                            <div className="neon-spinner"></div>
                        </div>
                    ))}
                </div>
            ) : filteredTickets.length > 0 ? (
                <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 neon-card">
                    <Zap className="w-16 h-16 mx-auto text-[var(--neon-cyan)] opacity-30 mb-4" />
                    <p className="text-[var(--text-muted)] text-lg">No tickets found</p>
                    <Link
                        to="/create"
                        className="inline-block mt-6 btn-gradient"
                    >
                        Create your first ticket
                    </Link>
                </div>
            )}
        </div>
    );
}
