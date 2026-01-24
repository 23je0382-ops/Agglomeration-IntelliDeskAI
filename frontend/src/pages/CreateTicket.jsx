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
                <div className="neon-card bg-[var(--bg-card)] shadow-xl">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                            <Zap className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold font-['Orbitron'] text-green-700">Ticket Created!</h2>
                        <p className="text-[var(--text-muted)] mt-2">AI has classified and analyzed your ticket</p>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-transparent via-green-200 to-transparent mb-8"></div>

                    {/* Ticket Info */}
                    <div className="space-y-6">
                        <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border-color)]">
                            <h3 className="font-bold text-xl text-[var(--text-primary)]">{createdTicket.title}</h3>
                            <p className="text-[var(--text-secondary)] mt-2 leading-relaxed">{createdTicket.description}</p>
                        </div>

                        {/* Classification Results */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--bg-tertiary)] rounded-xl p-5 border border-[var(--border-color)] flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4 text-[var(--neon-cyan)]" />
                                    <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-semibold">Type</span>
                                </div>
                                <span className={`badge type-${createdTicket.type} self-start`}>
                                    {createdTicket.type?.replace(/-/g, ' ')}
                                </span>
                            </div>
                            <div className="bg-[var(--bg-tertiary)] rounded-xl p-5 border border-[var(--border-color)] flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                                    <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-semibold">Priority</span>
                                </div>
                                <span className={`badge priority-${createdTicket.priority} self-start`}>
                                    {createdTicket.priority}
                                </span>
                            </div>
                        </div>

                        {/* AI Suggested Response */}
                        {createdTicket.suggested_response && (
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold flex items-center gap-2 text-purple-700">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                        AI Suggested Response
                                    </h4>
                                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wide">
                                        Confidence: {Math.round((createdTicket.confidence_score || 0) * 100)}%
                                    </span>
                                </div>
                                <div className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                                    {createdTicket.suggested_response}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => navigate(`/tickets/${createdTicket.id}`)}
                                className="flex-1 btn-gradient shadow-lg hover:shadow-xl transition-shadow"
                            >
                                View & Manage Ticket
                            </button>
                            <button
                                onClick={() => {
                                    setCreatedTicket(null);
                                    setFormData({ title: '', description: '', customer_email: '' });
                                }}
                                className="flex-1 btn-neon text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]"
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
                <h1 className="text-4xl font-bold font-['Orbitron'] text-[var(--text-primary)]">Create Ticket</h1>
                <p className="text-[var(--text-muted)] mt-2">
                    Submit a support request and our AI will classify and suggest a response
                </p>
            </div>

            <form onSubmit={handleSubmit} className="neon-card bg-[var(--bg-card)] shadow-xl relative overflow-hidden">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-6 relative z-10">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-bold mb-2 text-[var(--text-secondary)] uppercase tracking-wider">
                            Ticket Title <span className="text-[var(--text-muted)] font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Brief summary (or auto-generated)"
                            className="neon-input bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-bold mb-2 text-[var(--text-secondary)] uppercase tracking-wider">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={6}
                            placeholder="Describe the issue in detail..."
                            className="neon-input resize-none bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]"
                        />
                    </div>

                    {/* Customer Email */}
                    <div>
                        <label htmlFor="customer_email" className="block text-sm font-bold mb-2 text-[var(--text-secondary)] uppercase tracking-wider">
                            Customer Email <span className="text-[var(--text-muted)] font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                            type="email"
                            id="customer_email"
                            name="customer_email"
                            value={formData.customer_email}
                            onChange={handleChange}
                            placeholder="customer@example.com"
                            className="neon-input bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]"
                        />
                    </div>

                    <div className="h-[1px] bg-[var(--border-color)] my-6"></div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !formData.description}
                        className="w-full btn-gradient py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
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
