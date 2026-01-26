import { useState, useEffect } from 'react';
import { Users, Building2, Search, Filter, Loader2, Mail } from 'lucide-react';
import { customersAPI } from '../services/api';

export default function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'accounts'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [customersData, accountsData] = await Promise.all([
                customersAPI.getCustomers(),
                customersAPI.getAccounts()
            ]);
            setCustomers(customersData);
            setAccounts(accountsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.account && c.account.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredAccounts = accounts.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Customer Management</h1>
                    <p className="text-[var(--text-muted)] mt-2">
                        Manage your customers and organizations
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-[var(--border-color)]">
                <button
                    onClick={() => setActiveTab('customers')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'customers'
                        ? 'text-[var(--neon-cyan)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users size={18} />
                        Customers
                    </div>
                    {activeTab === 'customers' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--neon-cyan)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'accounts'
                        ? 'text-[var(--neon-purple)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Building2 size={18} />
                        Accounts
                    </div>
                    {activeTab === 'accounts' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--neon-purple)]" />
                    )}
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-purple)]" />
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="neon-input pl-12 w-full"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--neon-cyan)]" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {activeTab === 'customers' && (
                        <div className="grid gap-4">
                            {filteredCustomers.map(customer => (
                                <div key={customer.id} className="neon-card group hover:border-[var(--neon-cyan)] transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-lg text-[var(--text-primary)]">{customer.email}</h3>
                                                {customer.name && (
                                                    <span className="text-sm text-[var(--text-muted)]">({customer.name})</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 mt-2">
                                                {customer.account ? (
                                                    <div className="flex items-center gap-2 text-sm text-[var(--neon-purple)] bg-[rgba(157,78,221,0.1)] px-3 py-1 rounded-full border border-[rgba(157,78,221,0.2)]">
                                                        <Building2 size={14} />
                                                        {customer.account.name}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-[var(--text-muted)] italic">No Account</div>
                                                )}
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    ID: {customer.id}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <div className="text-center py-10 text-[var(--text-muted)]">
                                    No customers found
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'accounts' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAccounts.map(account => (
                                <div key={account.id} className="neon-card hover:translate-y-[-2px] transition-transform">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[rgba(157,78,221,0.1)] flex items-center justify-center text-[var(--neon-purple)]">
                                            <Building2 size={24} />
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full border ${account.tier === 'enterprise' ? 'border-[var(--neon-green)] text-[var(--neon-green)]' :
                                            account.tier === 'smb' ? 'border-[var(--neon-cyan)] text-[var(--neon-cyan)]' :
                                                'border-[var(--text-muted)] text-[var(--text-muted)]'
                                            }`}>
                                            {account.tier.toUpperCase()}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-1">{account.name}</h3>
                                    <a href={`http://${account.domain}`} target="_blank" rel="noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--neon-cyan)] flex items-center gap-1 mb-4">
                                        {account.domain}
                                    </a>

                                    <div className="pt-4 border-t border-[rgba(255,255,255,0.1)] flex justify-between items-center text-sm text-[var(--text-muted)]">
                                        <span>{account.industry || 'Unknown Industry'}</span>
                                        <span>ID: {account.id}</span>
                                    </div>
                                </div>
                            ))}
                            {filteredAccounts.length === 0 && (
                                <div className="col-span-full text-center py-10 text-[var(--text-muted)]">
                                    No accounts found
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
