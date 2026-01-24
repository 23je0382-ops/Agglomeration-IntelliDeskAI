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

    return (
        <div className="fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Email Inbox</h1>
                    <p className="text-[var(--text-muted)] mt-2">Real-time harvested email communications</p>
                </div>
                <button
                    onClick={fetchEmails}
                    className="btn-neon flex items-center gap-2 self-start"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
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
        </div>
    );
}
