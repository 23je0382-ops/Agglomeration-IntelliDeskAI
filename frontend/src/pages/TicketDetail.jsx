import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Sparkles,
    RefreshCw,
    Send,
    CheckCircle,
    Edit3,
    Clock,
    User,
    Trash2,
    Loader2,
} from 'lucide-react';
import { ticketsAPI } from '../services/api';

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [approving, setApproving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedResponse, setEditedResponse] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchTicket() {
            try {
                const data = await ticketsAPI.getById(id);
                setTicket(data);
                setEditedResponse(data.suggested_response || '');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchTicket();
    }, [id]);

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const updated = await ticketsAPI.regenerate(id);
            setTicket(updated);
            setEditedResponse(updated.suggested_response || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setRegenerating(false);
        }
    };

    const handleApprove = async () => {
        setApproving(true);
        try {
            const updated = await ticketsAPI.approve(id, editedResponse);
            setTicket(updated);
            setEditMode(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setApproving(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const updated = await ticketsAPI.update(id, { status: newStatus });
            setTicket(updated);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await ticketsAPI.delete(id);
            navigate('/tickets');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="fade-in">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-[var(--bg-secondary)] rounded-xl w-1/3" />
                    <div className="h-64 bg-[var(--bg-secondary)] rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error && !ticket) {
        return (
            <div className="fade-in text-center py-16">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={() => navigate('/tickets')}
                    className="mt-4 btn-gradient px-6 py-2 rounded-xl text-white font-medium"
                >
                    Back to Queue
                </button>
            </div>
        );
    }

    const createdAt = new Date(ticket.created_at).toLocaleString();

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/tickets')}
                    className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-[var(--text-muted)]">#{ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium status-${ticket.status}`}>
                            {ticket.status.replace('_', ' ')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold">{ticket.title}</h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <h2 className="font-semibold mb-4">Description</h2>
                        <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {/* AI Response Section */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                AI Suggested Response
                            </h2>
                            {ticket.confidence_score && (
                                <span className="text-sm text-[var(--text-muted)]">
                                    Confidence: {Math.round(ticket.confidence_score * 100)}%
                                </span>
                            )}
                        </div>

                        {editMode ? (
                            <textarea
                                value={editedResponse}
                                onChange={(e) => setEditedResponse(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none mb-4"
                            />
                        ) : (
                            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-4">
                                <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                                    {ticket.suggested_response || 'No response generated yet.'}
                                </p>
                            </div>
                        )}

                        {ticket.final_response && (
                            <div className="mt-4">
                                <h3 className="font-medium text-sm text-[var(--text-muted)] mb-2">Approved Response</h3>
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{ticket.final_response}</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <div className="flex flex-wrap gap-3 mt-4">
                                <button
                                    onClick={handleRegenerate}
                                    disabled={regenerating}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] transition-colors disabled:opacity-50"
                                >
                                    {regenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    Regenerate
                                </button>
                                <button
                                    onClick={() => setEditMode(!editMode)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    {editMode ? 'Cancel Edit' : 'Edit'}
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl btn-gradient text-white disabled:opacity-50"
                                >
                                    {approving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Approve & Send
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Ticket Info */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <h2 className="font-semibold mb-4">Details</h2>
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-[var(--text-muted)]">Type</span>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium type-${(ticket.type || 'general').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                                        {ticket.type}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-[var(--text-muted)]">Priority</span>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium priority-${ticket.priority}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-[var(--text-muted)]">Created</span>
                                <div className="mt-1 flex items-center gap-2 text-[var(--text-secondary)]">
                                    <Clock className="w-4 h-4" />
                                    {createdAt}
                                </div>
                            </div>
                            {ticket.customer_email && (
                                <div>
                                    <span className="text-sm text-[var(--text-muted)]">Customer</span>
                                    <div className="mt-1 flex items-center gap-2 text-[var(--text-secondary)]">
                                        <User className="w-4 h-4" />
                                        {ticket.customer_email}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Actions */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <h2 className="font-semibold mb-4">Update Status</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={ticket.status === status}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${ticket.status === status
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
                                        }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
