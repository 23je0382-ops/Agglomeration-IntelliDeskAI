import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    User, Mail, Calendar, Shield, Settings, Bell, Lock,
    LogOut, ArrowRight, ShieldCheck, Users, X, Loader2,
    AlertCircle, CheckCircle
} from 'lucide-react';

export default function Profile() {
    const { user, token, logout, refreshUser } = useAuth();

    // Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    // Check for edit param on load
    useEffect(() => {
        if (searchParams.get('edit') === 'true') {
            setIsEditing(true);
            // Clean up the URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('edit');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Form State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    if (!user) return null;

    const handleUpdateSettings = async (e) => {
        e.preventDefault();

        // Basic validation for password change
        if (formData.password && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                name: formData.name,
                email: formData.email
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            const res = await fetch('https://agglomeration-intellideskai.onrender.com/api/auth/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to update account settings');
            }

            await refreshUser();
            setSuccess('Account settings updated successfully!');
            setIsEditing(false);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Jan 2024';

    if (isEditing) {
        return (
            <div className="fade-in max-w-2xl mx-auto space-y-8">
                {/* Notifications */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-500 border border-red-600 text-white shadow-2xl flex items-center gap-3 animate-fade-left">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">{error}</span>
                        <button onClick={() => setError(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
                    </div>
                )}

                <div className="neon-card relative overflow-hidden shadow-2xl animate-fade-up">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-purple)] to-[var(--neon-blue)]"></div>

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold font-['Orbitron'] gradient-text">Account Settings</h2>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Update your identity and security preferences</p>
                        </div>
                        <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleUpdateSettings} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-[10px] uppercase font-black tracking-widest text-[var(--neon-cyan)] opacity-70">Personal Details</h3>
                                <div className="group/field">
                                    <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            className="neon-input pl-12 h-12"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="group/field">
                                    <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-cyan)] transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            className="neon-input pl-12 h-12 text-sm"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] uppercase font-black tracking-widest text-[var(--neon-purple)] opacity-70">Security & Password</h3>
                                <div className="group/field">
                                    <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2 ml-1">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-purple)] transition-colors" />
                                        <input
                                            type="password"
                                            className="neon-input pl-12 h-12 text-sm"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="group/field">
                                    <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2 ml-1">Confirm Update</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within/field:text-[var(--neon-purple)] transition-colors" />
                                        <input
                                            type="password"
                                            className="neon-input pl-12 h-12 text-sm"
                                            placeholder="Repeat password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-4">
                            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-[var(--neon-cyan)] flex-shrink-0" />
                                <span>Changing your email will update your login credentials. Leave password fields blank if you don't wish to change your authentication.</span>
                            </p>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-6 py-4 rounded-xl bg-white/5 font-bold text-sm hover:bg-white/10 transition-all border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] btn-gradient py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-sm shadow-xl shadow-[var(--neon-cyan)]/20"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Save All Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
    return (
        <div className="fade-in max-w-4xl mx-auto space-y-8">
            {/* Notifications */}
            {error && (
                <div className="fixed top-24 right-8 z-[100] p-4 rounded-xl bg-red-500 border border-red-600 text-white shadow-2xl flex items-center gap-3 animate-fade-left">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">{error}</span>
                    <button onClick={() => setError(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
            )}

            {success && (
                <div className="fixed top-24 right-8 z-[100] p-4 rounded-xl bg-green-500 border border-green-600 text-white shadow-2xl flex items-center gap-3 animate-fade-left">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">{success}</span>
                </div>
            )}

            {/* Header / Hero */}
            <div className="neon-card relative overflow-hidden p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--neon-cyan)]/5 rounded-full -mr-32 -mt-32"></div>

                {/* Edit Button */}
                <div className="absolute top-8 right-8 z-20">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition-all group shadow-lg"
                    >
                        <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                        Edit Profile
                    </button>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-blue)] flex items-center justify-center text-white shadow-xl shadow-[var(--neon-cyan)]/20">
                            <span className="text-5xl font-bold font-['Orbitron']">
                                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center shadow-lg">
                            <Shield className="w-5 h-5 text-[var(--neon-green)]" />
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold font-['Orbitron'] text-[var(--text-primary)] mb-2">
                            {user.name || 'Team Member'}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[var(--text-muted)]">
                            <span className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] px-3 py-1 rounded-full text-xs font-semibold">
                                <Shield className="w-3 h-3 text-[var(--neon-cyan)]" />
                                {user.role || 'No Role Assigned'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Joined {memberSince}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Information Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="neon-card">
                        <h2 className="text-lg font-bold font-['Orbitron'] mb-6">Details</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[var(--neon-cyan)]/5">
                                    <User className="w-4 h-4 text-[var(--neon-cyan)]" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Full Name</p>
                                    <p className="text-sm font-medium">{user.name || 'Not Set'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[var(--neon-purple)]/5">
                                    <Mail className="w-4 h-4 text-[var(--neon-purple)]" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Email Address</p>
                                    <p className="text-sm font-medium">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[var(--neon-pink)]/5">
                                    <Shield className="w-4 h-4 text-[var(--neon-pink)]" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Access Level</p>
                                    <p className="text-sm font-medium">Internal Staff</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full neon-card border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 flex items-center justify-center gap-3 text-red-500 transition-all font-bold group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>

                {/* Main Content Areas */}
                <div className="md:col-span-2 space-y-6">
                    {/* Admin Tools Section */}
                    {user.role === 'admin' && (
                        <div className="neon-card border-[var(--neon-purple)]/30 bg-[var(--neon-purple)]/5">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-[var(--neon-purple)]" />
                                    <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-purple)]">Admin Tools</h2>
                                </div>
                                <span className="badge type-technical-support bg-purple-500/10 text-purple-500">System Root</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => window.location.href = '/users'}
                                    className="w-full p-4 rounded-xl flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--neon-cyan)]/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[var(--neon-cyan)]" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">User Management</p>
                                            <p className="text-xs text-[var(--text-muted)]">Create accounts and manage team permissions</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </button>

                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center gap-3 opacity-60">
                                    <Lock className="w-4 h-4 text-orange-500" />
                                    <span className="text-[10px] uppercase font-bold text-orange-500">More Tools Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Information */}
                <div className="p-6 rounded-[2rem] bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Shield className="w-6 h-6 text-[var(--neon-green)]" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Security Audit</p>
                            <p className="text-sm font-medium">Your account is fully secured using RSA-256</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono bg-white/50 px-2 py-1 rounded text-[var(--text-muted)]">
                        V:1.2.0-stable
                    </span>
                </div>
            </div>
        </div>
    );
}

