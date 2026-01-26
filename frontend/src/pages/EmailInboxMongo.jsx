import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Search, Clock, Trash2, Database, X, ArrowLeft, Zap, Send } from 'lucide-react';

export default function EmailInboxMongo() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    const sendReply = async () => {
        if (!replyText.trim() || !selectedEmail) return;
        setSendingReply(true);
        try {
            // Attempt to get a clean email from the "from" field
            let toEmail = selectedEmail.from;
            if (toEmail.includes('<')) {
                toEmail = toEmail.split('<')[1].replace('>', '').trim();
            }

            const response = await fetch('http://127.0.0.1:8000/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_email: toEmail,
                    subject: `Re: ${selectedEmail.subject}`,
                    body: replyText
                })
            });

            if (response.ok) {
                alert("Reply sent successfully!");
                setReplyText("");
            } else {
                alert("Failed to send reply.");
            }
        } catch (e) {
            console.error(e);
            alert("Error sending reply.");
        } finally {
            setSendingReply(false);
        }
    };

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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-purple)]" />
                <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="neon-input pl-12"
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
                    <div className="fixed inset-0 z-[5000] w-full h-full bg-[var(--bg-primary)] animate-in slide-in-from-right duration-200 flex flex-col">

                        {/* Toolbar (Gmail style) */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] transition-colors"
                                    title="Back"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="h-6 w-[1px] bg-[var(--border-color)]"></div>

                                {/* Logo for consistency */}
                                <div className="flex items-center gap-3 mr-4">
                                    <div>
                                        <h1 className="font-bold text-xl font-['Orbitron'] text-[var(--text-primary)] tracking-wide hidden sm:block">IntelliDesk</h1>
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold pl-0.5 hidden sm:block">AI Helpdesk</p>
                                    </div>
                                </div>

                                <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] transition-colors" title="Archive">
                                    <Database className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => deleteEmail(e, selectedEmail.uid)}
                                    className="p-2 hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 rounded-full transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] transition-colors" title="Mark as unread">
                                    <Mail className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Email Content Scrollable Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)]">
                            <div className="w-full min-h-full px-4 py-8 bg-[var(--bg-card)]">

                                {/* Subject & Labels */}
                                <div className="mb-8">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <h1 className="text-2xl md:text-3xl font-normal text-[var(--text-primary)] leading-tight">
                                            {selectedEmail.subject || "(No Subject)"}
                                        </h1>
                                        <div className="flex gap-2 shrink-0">
                                            <span className="px-2 py-1 bg-[var(--bg-tertiary)] text-xs font-medium rounded text-[var(--text-secondary)]">
                                                Inbox
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sender Info Row */}
                                <div className="flex items-start justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-[var(--neon-cyan)] text-white flex items-center justify-center text-lg font-bold shadow-sm">
                                            {(selectedEmail.from || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold text-[var(--text-primary)] text-base">
                                                    {selectedEmail.from?.split('<')[0].trim() || "Unknown Sender"}
                                                </span>
                                                <span className="text-sm text-[var(--text-muted)] hidden sm:inline">
                                                    {selectedEmail.from?.includes('<') ? `<${selectedEmail.from.split('<')[1]}` : ''}
                                                </span>
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 dropdown-trigger cursor-pointer hover:text-[var(--text-primary)] transition-colors">
                                                to me
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">
                                            <RefreshCw className="w-5 h-5 rotate-180" /> {/* Simulate Reply icon */}
                                        </button>
                                        <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">
                                            <Database className="w-5 h-5" /> {/* Simulate More icon */}
                                        </button>
                                    </div>
                                </div>

                                {/* Message Body */}
                                <div className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed text-base font-sans pb-12">
                                    {selectedEmail.body}
                                </div>

                                {/* Reply Box */}
                                <div className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-card)] shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                                            <RefreshCw className="w-4 h-4 rotate-180 text-[var(--text-secondary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder={`Reply to ${selectedEmail.from?.split('<')[0].trim() || "sender"}...`}
                                                className="w-full bg-transparent border-none outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-muted)] min-h-[100px]"
                                            />
                                            {replyText && (
                                                <div className="mt-2 flex justify-end animate-in fade-in slide-in-from-bottom-2">
                                                    <button
                                                        onClick={sendReply}
                                                        disabled={sendingReply}
                                                        className="px-6 py-2 bg-[var(--neon-cyan)] text-black font-bold rounded-lg hover:bg-[var(--neon-blue)] transition-colors flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        {sendingReply ? (
                                                            <>Sending...</>
                                                        ) : (
                                                            <>
                                                                <Send className="w-4 h-4" /> Send
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
