import { useState, useEffect } from 'react';
import {
    Building2,
    Search,
    Filter,
    Loader2,
    BarChart3,
    Users,
    ChevronRight,
    MapPin,
    Activity
} from 'lucide-react';
import { customersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Organizations() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const data = await customersAPI.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.domain.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Organizations</h1>
                    <p className="text-[var(--text-muted)] mt-2">
                        Manage enterprise accounts and domain-level insights
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-purple)]" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="neon-input pl-12 w-full"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="neon-input w-[180px]"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="lead">Lead</option>
                    <option value="trial">Trial</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--neon-cyan)]" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAccounts.map(account => (
                        <div
                            key={account.id}
                            onClick={() => navigate(`/organizations/${account.id}`)}
                            className="neon-card group hover:border-[var(--neon-cyan)] cursor-pointer transition-all p-6 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-50">
                                <Building2 size={80} strokeWidth={0.5} className="text-[var(--primary)] -mr-4 -mt-4 transform rotate-12" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-[var(--text-primary)] mb-1">{account.name}</h3>
                                        <span className="text-sm text-[var(--text-muted)] font-mono">{account.domain}</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs uppercase font-bold border ${account.status === 'lead' ? 'border-[var(--neon-purple)] text-[var(--neon-purple)]' :
                                        account.status === 'trial' ? 'border-yellow-500 text-yellow-500' :
                                            'border-[var(--neon-green)] text-[var(--neon-green)]'
                                        }`}>
                                        {account.status}
                                    </div>
                                </div>

                                <div className="space-y-3 mt-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-muted)] flex items-center gap-2">
                                            <Users size={14} /> Total Users
                                        </span>
                                        <span className="font-bold text-[var(--text-primary)]">{account.user_count}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-muted)] flex items-center gap-2">
                                            <Activity size={14} /> Last Activity
                                        </span>
                                        <span className="text-[var(--text-primary)]">
                                            {account.last_activity_at ? new Date(account.last_activity_at).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-muted)] flex items-center gap-2">
                                            <BarChart3 size={14} /> Tier
                                        </span>
                                        <span className="capitalize text-[var(--text-secondary)]">{account.tier}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
