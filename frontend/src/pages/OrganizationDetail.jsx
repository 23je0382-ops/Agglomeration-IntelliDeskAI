import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2,
    ArrowLeft,
    Building2,
    Mail,
    Calendar,
    Users,
    MapPin,
    BarChart
} from 'lucide-react';
import { customersAPI } from '../services/api';

export default function OrganizationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            // Need to fetch specific account details. 
            // The list endpoint returns aggregation as well, but let's implement a specific fetch if user wants deep dive.
            // Since we updated the backend to support /accounts/{id}, let's use it.
            // But we didn't add that to api.js yet. We'll do it shortly.
            // For now, let's assume we can fetch customers filtered by account_id.

            const [accData, usersData] = await Promise.all([
                fetch(`https://agglomeration-intellideskai.onrender.com/api/accounts/${id}`).then(res => res.json()), // Direct fetch for now or update api.js
                customersAPI.getCustomers({ account_id: id })
            ]);

            setAccount(accData);
            setUsers(usersData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    if (!account) return <div className="p-8 text-center">Account not found</div>;

    // Aggregation Logic for frontend (Roles/Departments)
    const departments = users.reduce((acc, user) => {
        const dept = user.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="fade-in max-w-7xl mx-auto">
            <button onClick={() => navigate('/organizations')} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Organizations
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="neon-card p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center border border-[rgba(139,92,246,0.3)]">
                                <Building2 size={32} className="text-[var(--neon-purple)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{account.name}</h1>
                                <p className="text-[var(--text-muted)] text-sm">{account.domain}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)]">Status</span>
                                <span className="uppercase font-bold text-[var(--neon-green)]">{account.status}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)]">Tier</span>
                                <span className="capitalize">{account.tier}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)]">Industry</span>
                                <span className="capitalize">{account.industry || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)]">Last Activity</span>
                                <span>{new Date(account.last_activity_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <BarChart size={16} /> Department Breakdown
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(departments).map(([dept, count]) => (
                                    <div key={dept} className="flex items-center justify-between text-sm">
                                        <span>{dept}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--neon-cyan)]"
                                                    style={{ width: `${(count / users.length) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[var(--text-muted)] w-6 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="neon-card p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Users size={20} className="text-[var(--neon-blue)]" />
                            Users & Contacts ({users.length})
                        </h2>

                        <div className="space-y-4">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--active-item)] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--neon-blue)] to-purple-600 flex items-center justify-center text-white font-bold">
                                            {user.name ? user.name[0] : user.email[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold">{user.name || user.email.split('@')[0]}</h4>
                                            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-[var(--neon-cyan)]">{user.role || 'User'}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{user.department}</p>
                                    </div>
                                </div>
                            ))}

                            {users.length === 0 && (
                                <p className="text-center text-[var(--text-muted)] py-8">No users found for this organization.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

