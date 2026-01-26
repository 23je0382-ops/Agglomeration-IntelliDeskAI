import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text mb-2">IntelliDesk</h1>
                    <p className="text-[var(--text-muted)] tracking-wide uppercase text-sm font-semibold">AI-Powered Helpdesk</p>
                </div>

                {/* Card */}
                <div className="neon-card bg-[var(--bg-card)] backdrop-blur-xl relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-purple)] to-[var(--neon-pink)]"></div>

                    <h2 className="text-2xl font-bold font-['Orbitron'] text-[var(--text-primary)] mb-6 text-center">
                        Employee Login
                    </h2>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="neon-input pl-12"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="neon-input pl-12"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gradient py-3 rounded-xl flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-['Orbitron'] tracking-wide"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-[var(--text-muted)] text-xs mt-8 opacity-60">
                    &copy; 2024 IntelliDesk AI. Secure Enterprise Login.
                </p>
            </div>
        </div>
    );
}
