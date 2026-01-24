import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2, Zap, Tag, AlertCircle } from 'lucide-react';
import { ticketsAPI } from '../services/api';

export default function CreateTicket() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        customer_email: '',
    });
    const [createdTicket, setCreatedTicket] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const ticket = await ticketsAPI.create(formData);
            setCreatedTicket(ticket);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (createdTicket) {
        return (
            <div className="fade-in max-w-3xl mx-auto">
                <div className="neon-card">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-[rgba(0,255,136,0.1)] border border-[var(--neon-green)] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(0,255,136,0.3)]">
                            <Zap className="w-10 h-10 text-[var(--neon-green)]" style={{ filter: 'drop-shadow(0 0 10px var(--neon-green))' }} />
                        </div>
                        <h2 className="text-3xl font-bold font-['Orbitron'] text-[var(--neon-green)]" style={{ textShadow: '0 0 20px rgba(0,255,136,0.5)' }}>Ticket Created!</h2>
                        <p className="text-[var(--text-muted)] mt-2">AI has classified and analyzed your ticket</p>
                    </div>

                    {/* Cyber line */}
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--neon-green)] to-transparent mb-8"></div>

                    {/* Ticket Info */}
                    <div className="space-y-6">
                        <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-5 border border-[rgba(0,255,255,0.1)]">
                            <h3 className="font-bold text-xl text-[var(--neon-cyan)]">{createdTicket.title}</h3>
                            <p className="text-[var(--text-secondary)] mt-3">{createdTicket.description}</p>
                        </div>

                        {/* Classification Results */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-5 border border-[rgba(0,255,255,0.1)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="w-4 h-4 text-[var(--neon-cyan)]" />
                                    <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">Type</span>
                                </div>
                                <span className={`badge type-${createdTicket.type}`}>
                                    {createdTicket.type}
                                </span>
                            </div>
                            <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-5 border border-[rgba(0,255,255,0.1)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                                    <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">Priority</span>
                                </div>
                                <span className={`badge priority-${createdTicket.priority}`}>
                                    {createdTicket.priority}
                                </span>
                            </div>
                        </div>

                        {/* AI Suggested Response */}
                        {createdTicket.suggested_response && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold flex items-center gap-2 text-[var(--neon-pink)]">
                                        <Zap className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 5px var(--neon-pink))' }} />
                                        AI Suggested Response
                                    </h4>
                                    <span className="text-sm text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">
                                        Confidence: <span className="text-[var(--neon-cyan)]">{Math.round((createdTicket.confidence_score || 0) * 100)}%</span>
                                    </span>
                                </div>
                                <div className="bg-[rgba(255,0,255,0.05)] border border-[rgba(255,0,255,0.2)] rounded-xl p-5">
                                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                                        {createdTicket.suggested_response}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => navigate(`/tickets/${createdTicket.id}`)}
                                className="flex-1 btn-gradient"
                            >
                                View & Manage Ticket
                            </button>
                            <button
                                onClick={() => {
                                    setCreatedTicket(null);
                                    setFormData({ title: '', description: '', customer_email: '' });
                                }}
                                className="flex-1 btn-neon"
                            >
                                Create Another
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Create Ticket</h1>
                <p className="text-[var(--text-muted)] mt-2">
                    Submit a support request and our AI will classify and suggest a response
                </p>
            </div>

            <form onSubmit={handleSubmit} className="neon-card">
                {error && (
                    <div className="mb-6 bg-[rgba(255,0,102,0.1)] border border-[var(--neon-red)] rounded-xl p-4 text-[var(--neon-red)]">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold mb-2 text-[var(--neon-cyan)] uppercase tracking-wider">
                            Ticket Title <span className="text-[var(--text-muted)] lowercase">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Brief summary (or auto-generated)"
                            className="neon-input"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold mb-2 text-[var(--neon-cyan)] uppercase tracking-wider">
                            Description <span className="text-[var(--neon-red)]">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={6}
                            placeholder="Describe the issue in detail..."
                            className="neon-input resize-none"
                        />
                    </div>

                    {/* Customer Email */}
                    <div>
                        <label htmlFor="customer_email" className="block text-sm font-semibold mb-2 text-[var(--neon-pink)] uppercase tracking-wider">
                            Customer Email <span className="text-[var(--text-muted)] lowercase">(optional)</span>
                        </label>
                        <input
                            type="email"
                            id="customer_email"
                            name="customer_email"
                            value={formData.customer_email}
                            onChange={handleChange}
                            placeholder="customer@example.com"
                            className="neon-input"
                        />
                    </div>

                    {/* Cyber line */}
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent"></div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !formData.description}
                        className="w-full btn-gradient py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        {loading ? (
                            <>
                                <div className="neon-spinner w-5 h-5 !border-2"></div>
                                Analyzing with AI...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Create Ticket
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
