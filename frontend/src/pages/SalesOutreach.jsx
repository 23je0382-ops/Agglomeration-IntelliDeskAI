import { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Building2,
    Search,
    Filter,
    Loader2,
    Mail,
    Calendar,
    Briefcase
} from 'lucide-react';
import { customersAPI } from '../services/api';

export default function SalesOutreach() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const data = await customersAPI.getCustomers();
            // Simulate "New Leads" by sorting by ID desc or created_at
            // For now, we just take all customers
            setCustomers(data);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredCustomers = customers.filter(c => {
        const matchesSearch =
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.account && c.account.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = filterRole === 'all' || (c.role && c.role.toLowerCase().includes(filterRole));

        return matchesSearch && matchesRole;
    });

    return (
        <div className="fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Sales & Outreach</h1>
                    <p className="text-[var(--text-muted)] mt-2">
                        Track new leads and manage customer relationships
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
                        <TrendingUp className="text-[var(--neon-green)]" size={20} />
                        <div>
                            <span className="text-xs text-[var(--text-muted)] block">Total Leads</span>
                            <span className="font-bold text-lg">{customers.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-purple)]" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="neon-input pl-12 w-full"
                    />
                </div>

                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="neon-input w-[180px]"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Administrators</option>
                    <option value="sales">Sales</option>
                    <option value="tech">Technical</option>
                </select>
            </div>

            {/* Leads Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--neon-cyan)]" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                            <div key={customer.id} className="neon-card group hover:border-[var(--neon-cyan)] transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                    {/* User Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-blue)] flex items-center justify-center text-black font-bold text-lg">
                                                {customer.name ? customer.name[0].toUpperCase() : customer.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-[var(--text-primary)]">{customer.name || customer.email.split('@')[0]}</h3>
                                                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                    <Mail size={14} />
                                                    {customer.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enriched Details */}
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-[var(--text-muted)] block mb-1">Role</span>
                                            {customer.role ? (
                                                <span className="badge border border-[var(--neon-purple)] text-[var(--neon-purple)]">
                                                    {customer.role}
                                                </span>
                                            ) : (
                                                <span className="text-sm italic text-[var(--text-muted)]">Unknown</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-xs text-[var(--text-muted)] block mb-1">Department</span>
                                            <span className="text-sm text-[var(--text-primary)]">
                                                {customer.department || <span className="italic text-[var(--text-muted)]">Unknown</span>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Account Info */}
                                    <div className="flex-1">
                                        <span className="text-xs text-[var(--text-muted)] block mb-1">Organization</span>
                                        {customer.account ? (
                                            <div className="flex items-center gap-2 text-[var(--neon-cyan)]">
                                                <Building2 size={16} />
                                                <span className="font-medium">{customer.account.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm italic text-[var(--text-muted)]">Individual</span>
                                        )}
                                    </div>

                                    {/* Actions / Meta */}
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] justify-end mb-2">
                                            <Calendar size={12} />
                                            Joined {new Date(customer.created_at).toLocaleDateString()}
                                        </div>
                                        <button className="btn-secondary text-xs py-1 px-3">
                                            View Profile
                                        </button>
                                    </div>

                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-[var(--text-muted)]">
                            <p>No leads found matching your filters.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
