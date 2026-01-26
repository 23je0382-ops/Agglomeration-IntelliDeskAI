import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    UserPlus,
    Shield,
    Mail,
    Calendar,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle,
    Trash2,
    X,
    Lock
} from 'lucide-react';

export default function UserManagement() {
    const { token, isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: ''
    });

    const [editFormData, setEditFormData] = useState({
        email: '',
        name: '',
        role: '',
        password: ''
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    async function fetchUsers() {
        try {
            const res = await fetch('https://agglomeration-intellideskai.onrender.com/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddUser(e) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('https://agglomeration-intellideskai.onrender.com/api/auth/add-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Could not add user');
            }

            setSuccess(`User ${formData.email} added successfully!`);
            setShowAddModal(false);
            setFormData({ email: '', name: '', password: '' });
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditFormData({
            email: user.email,
            name: user.name || '',
            role: user.role,
            password: ''
        });
        setShowEditModal(true);
    };

    async function handleEditUser(e) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = { ...editFormData };
            if (!payload.password) delete payload.password;

            const res = await fetch(`https://agglomeration-intellideskai.onrender.com/api/auth/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Could not update user');
            }

            setSuccess(`User ${editFormData.email} updated successfully!`);
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteUser() {
        if (!userToDelete) return;
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`https://agglomeration-intellideskai.onrender.com/api/auth/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Could not delete user');
            }

            setSuccess(`User ${userToDelete.email} removed successfully.`);
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Shield className="w-16 h-16 text-red-500 opacity-20 mb-4" />
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-[var(--text-muted)]">You do not have administrative privileges.</p>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-['Orbitron'] gradient-text">User Management</h1>
                    <p className="text-[var(--text-muted)] mt-1 italic">
                        Control team access and manage administrative roles.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-gradient px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold tracking-wider"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Team Member
                </button>
            </div>

            {/* Notifications */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 text-sm font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500/50 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">{success}</span>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neon-purple)]" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="neon-input pl-12 h-12"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* User List Table */}
            <div className="neon-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Member</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Role</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Join Date</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--neon-cyan)]" />
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <p className="text-[var(--text-muted)] italic">No team members found matching your search.</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-black/[0.01] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--neon-cyan)]/10 flex items-center justify-center text-[var(--neon-cyan)] font-bold">
                                                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{user.name || 'N/A'}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`badge ${user.role === 'admin' ? 'type-technical-support' : 'type-general'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                            <Calendar className="w-3 h-3" />
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-xs font-bold text-[var(--neon-cyan)] hover:opacity-80 flex items-center gap-1"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="text-xs font-bold text-red-500 hover:opacity-80 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative neon-card w-full max-w-md shadow-2xl animate-fade-up">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold font-['Orbitron']">Add Team Member</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-[var(--text-muted)] hover:text-red-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="group/field">
                                <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1 pl-1 transition-colors group-focus-within/field:text-[var(--neon-cyan)]">Name</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="neon-input pl-12 h-12"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="group/field">
                                <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1 pl-1 transition-colors group-focus-within/field:text-[var(--neon-cyan)]">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="neon-input pl-12 h-12"
                                        placeholder="email@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="group/field">
                                <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1 pl-1 transition-colors group-focus-within/field:text-[var(--neon-cyan)]">Temporary Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="neon-input pl-12 h-12"
                                        placeholder="At least 8 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full btn-gradient py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-sm mt-8 shadow-lg shadow-[var(--neon-cyan)]/20"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                    <div className="relative neon-card w-full max-w-md shadow-2xl animate-fade-up">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold font-['Orbitron']">Edit Team Member</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-[var(--text-muted)] hover:text-red-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditUser} className="space-y-4">
                            <div className="group/field">
                                <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1 pl-1 transition-colors group-focus-within/field:text-[var(--neon-cyan)]">Name</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="neon-input pl-12 h-12"
                                        placeholder="Full Name"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="group/field">
                                <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1 pl-1 transition-colors group-focus-within/field:text-[var(--neon-cyan)]">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="neon-input pl-12 h-12"
                                        placeholder="email@company.com"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="group/field">
                                <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1 pl-1 transition-colors group-focus-within/field:text-[var(--neon-cyan)]">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                    <select
                                        className="neon-input pl-12 h-12 appearance-none bg-[var(--bg-secondary)]"
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="group/field">
                                <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1 pl-1 transition-colors group-focus-within/field:text-[var(--neon-cyan)]">New Password (Optional)</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                    <input
                                        type="password"
                                        className="neon-input pl-12 h-12"
                                        placeholder="Leave blank to keep current"
                                        value={editFormData.password}
                                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full btn-gradient py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-sm mt-8 shadow-lg shadow-[var(--neon-cyan)]/20"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                    <div className="relative neon-card w-full max-w-sm shadow-2xl animate-fade-up border-red-500/30">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertCircle className="w-6 h-6" />
                            <h2 className="text-xl font-bold font-['Orbitron']">Revoke Access?</h2>
                        </div>

                        <p className="text-sm text-[var(--text-muted)] mb-8">
                            Are you sure you want to remove <span className="font-bold text-[var(--text-primary)]">{userToDelete?.name || userToDelete?.email}</span>?
                            This action cannot be undone and they will lose all system access immediately.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] font-bold text-sm hover:bg-[var(--border-color)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

