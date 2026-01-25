import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Search, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { ticketsAPI } from '../services/api';

export default function EmailInbox() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEmails = async () => {
        setLoading(true);
        try {
            // Fetch directly from API
            const response = await fetch('http://127.0.0.1:8000/api/emails/');
            if (response.ok) {
                const data = await response.json();
                setEmails(data);
            }
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
        // Poll every 10 seconds for UI updates
        const interval = setInterval(fetchEmails, 10000);
        return () => clearInterval(interval);
    }, []);

    const deleteEmail = async (e, uid) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this email?')) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/emails/${uid}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setEmails(emails.filter(email => email.uid !== uid));
            }
        } catch (error) {
            console.error('Failed to delete email:', error);
        }
    };

    const filteredEmails = emails.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.body.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [selectedEmail, setSelectedEmail] = useState(null);

    return (
        <div className="fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Email Inbox</h1>
                    <p className="text-[var(--text-muted)] mt-2">Real-time harvested email communications</p>
                </div>
                <div className="flex gap-2 self-start">
                    <button
                        onClick={async () => {
                            if (!confirm("Are you sure you want to DELETE ALL emails? This cannot be undone.")) return;
                            try {
                                setLoading(true);
                                await fetch('http://127.0.0.1:8000/api/emails/all', { method: 'DELETE' });
                                await fetchEmails();
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-2 border border-red-200 transition-colors font-medium"
                    >
                        <Trash2 className="w-4 h-4" /> Delete All
                    </button>
                    <button
                        onClick={fetchEmails}
                        className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--border-color)] flex items-center gap-2 border border-[var(--border-color)] transition-colors"
                    >
                        <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-purple)]" />
                <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="neon-input pl-12"
                />
            </div>

            {/* Email List */}
            <div className="space-y-4">
                {filteredEmails.length > 0 ? (
                    filteredEmails.map((email, index) => (
                        <div
                            key={email.uid || index}
                            onClick={() => setSelectedEmail(email)}
                            className="neon-card group hover:bg-[rgba(139,92,246,0.05)] cursor-pointer p-6 transition-all duration-300 border border-[rgba(139,92,246,0.2)] hover:border-[var(--neon-purple)] relative"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center border border-[rgba(139,92,246,0.3)]">
                                            <Mail className="w-4 h-4 text-[var(--neon-purple)]" />
                                        </div>
                                        <span className="font-bold text-[var(--text-primary)] truncate">{email.from}</span>
                                        <span className="text-xs px-2 py-1 rounded bg-[rgba(139,92,246,0.1)] text-[var(--neon-purple)] border border-[rgba(139,92,246,0.2)]">
                                            New
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2 truncate">{email.subject}</h3>
                                    <p className="text-[var(--text-secondary)] text-sm line-clamp-2">{email.body}</p>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end gap-3">
                                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                        <Clock className="w-3 h-3" />
                                        {new Date(email.date).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={(e) => deleteEmail(e, email.uid)}
                                        className="p-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[var(--neon-red)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] transition-colors"
                                        title="Delete Email"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-50">
                        <Mail className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                        <h3 className="text-xl font-bold">No emails found</h3>
                        <p>Waiting for incoming messages...</p>
                    </div>
                )}
            </div>

            {/* Email Detail Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--neon-purple)] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                        {/* Header */}
                        <div className="p-6 border-b border-[rgba(139,92,246,0.2)] flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--neon-cyan)] mb-2">{selectedEmail.subject}</h2>
                                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                    <span className="font-semibold text-white">{selectedEmail.from}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed">
                            {selectedEmail.body}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[rgba(139,92,246,0.2)] flex justify-end gap-3">
                            <button
                                onClick={(e) => { deleteEmail(e, selectedEmail.uid); setSelectedEmail(null); }}
                                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="px-4 py-2 bg-[var(--neon-purple)] text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
