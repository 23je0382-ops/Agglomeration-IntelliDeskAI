import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Search, Clock, Trash2, Database, X } from 'lucide-react';

export default function EmailInboxMongo() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);

    const fetchEmails = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("DEBUG: Fetching Mongo Emails...");
            const response = await fetch('http://127.0.0.1:8000/api/emails/mongo');
            if (response.ok) {
                const data = await response.json();
                console.log("DEBUG: Data received:", data);
                if (Array.isArray(data)) {
                    setEmails(data);
                } else {
                    console.error("DEBUG: Data is not array:", data);
                    setError("Received invalid data format");
                }
            } else {
                console.error("DEBUG: Fetch failed:", response.status);
                setError(`Fetch failed: ${response.status}`);
            }
        } catch (err) {
            console.error('DEBUG: Network error:', err);
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("DEBUG: Component Mounted");
        fetchEmails();
        const interval = setInterval(fetchEmails, 10000);
        return () => clearInterval(interval);
    }, []);

    // Safe render helper
    const renderDate = (dateStr) => {
        try {
            if (!dateStr) return "No Date";
            return new Date(dateStr).toLocaleDateString();
        } catch (e) {
            return "Invalid Date";
        }
    };

    const deleteEmail = async (e, uid) => {
        if (e) e.stopPropagation();
        if (!confirm('Delete this email?')) return;
        try {
            await fetch(`http://127.0.0.1:8000/api/emails/${uid}`, { method: 'DELETE' });
            setEmails(prev => prev.filter(email => email.uid !== uid));
            if (selectedEmail && selectedEmail.uid === uid) {
                setSelectedEmail(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Safe filtering
    const filtered = (emails || []).filter(email => {
        if (!email) return false;
        try {
            const term = searchTerm.toLowerCase();
            const s = (email.subject || "").toLowerCase();
            const f = (email.from || "").toLowerCase();
            const b = (email.body || "").toLowerCase();
            return s.includes(term) || f.includes(term) || b.includes(term);
        } catch (e) {
            return false;
        }
    });

    return (
        <div className="p-4 space-y-6 fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2 font-['Orbitron']">
                    <Database className="w-8 h-8 text-[var(--neon-cyan)]" />
                    Mongo Inbox <span className="text-[var(--text-muted)] text-xl">({emails.length})</span>
                </h1>

                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (!confirm("Are you sure you want to DELETE ALL emails? This cannot be undone.")) return;
                            try {
                                setLoading(true);
                                await fetch('http://127.0.0.1:8000/api/emails/all', { method: 'DELETE' });
                                await fetchEmails();
                            } catch (e) {
                                console.error(e);
                                setError("Failed to delete all emails");
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

            {/* Error Message */}
            {
                error && (
                    <div className="bg-red-50 p-4 border border-red-200 rounded text-red-700 flex items-center gap-2">
                        Warning: {error}
                    </div>
                )
            }

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded py-3 pl-10 text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors shadow-sm"
                />
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-10 text-[var(--text-muted)]">
                        No emails found using "{searchTerm}"
                    </div>
                ) : (
                    filtered.map((email, idx) => (
                        <div
                            key={email?.uid || idx}
                            onClick={() => setSelectedEmail(email)}
                            className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl hover:shadow-md transition-all group relative cursor-pointer"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-[var(--bg-tertiary)] rounded-full">
                                            <Mail className="w-4 h-4 text-[var(--neon-purple)]" />
                                        </div>
                                        <span className="font-bold text-[var(--text-primary)] truncate">
                                            {email?.from || "Unknown Sender"}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded border border-[var(--border-color)]">
                                            UID: {email?.uid}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate mb-1">
                                        {email?.subject || "(No Subject)"}
                                    </h3>
                                    <p className="text-[var(--text-secondary)] text-sm line-clamp-2 leading-relaxed">
                                        {email?.body || ""}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                                        <Clock className="w-3 h-3" />
                                        {renderDate(email?.date)}
                                    </span>
                                    <button
                                        onClick={(e) => deleteEmail(e, email.uid)}
                                        className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {
                selectedEmail && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-start bg-[var(--bg-tertiary)]/50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-['Orbitron']">{selectedEmail.subject}</h2>
                                    <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                                        <span className="font-semibold">{selectedEmail.from}</span>
                                        <span>•</span>
                                        <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="p-2 hover:bg-[var(--border-color)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed text-lg bg-[var(--bg-card)]">
                                {selectedEmail.body}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3 bg-[var(--bg-tertiary)]/30 rounded-b-2xl">
                                <button
                                    onClick={(e) => deleteEmail(e, selectedEmail.uid)}
                                    className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="px-5 py-2.5 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--border-color)] transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
