import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Search, Clock, Trash2, Database } from 'lucide-react';

export default function EmailInboxMongo() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

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
        e.stopPropagation();
        if (!confirm('Delete this email?')) return;
        try {
            await fetch(`http://127.0.0.1:8000/api/emails/${uid}`, { method: 'DELETE' });
            setEmails(prev => prev.filter(email => email.uid !== uid));
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
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-green-400 flex items-center gap-2">
                    <Database className="w-8 h-8" />
                    Mongo Inbox ({emails.length})
                </h1>
                <button
                    onClick={fetchEmails}
                    className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 flex items-center gap-2 border border-gray-600"
                >
                    <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/50 p-4 border border-red-500 rounded text-red-200">
                    Error: {error}
                </div>
            )}

            {/* Debug View (Visible if items exist but list broken) */}
            <div className="bg-gray-900 p-2 rounded text-xs font-mono text-gray-500 mb-4 h-20 overflow-auto hidden">
                {JSON.stringify(emails.slice(0, 2), null, 2)}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-black/50 border border-green-500/30 rounded py-2 pl-10 text-white focus:border-green-400 outline-none transition-colors"
                />
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No emails found using "{searchTerm}"
                    </div>
                ) : (
                    filtered.map((email, idx) => (
                        <div
                            key={email?.uid || idx}
                            className="bg-gray-800/40 border border-green-500/20 p-4 rounded hover:border-green-500/60 transition-colors group relative"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="w-4 h-4 text-green-400" />
                                        <span className="font-bold text-white truncate">
                                            {email?.from || "Unknown Sender"}
                                        </span>
                                        <span className="text-[10px] px-1 bg-green-900/50 text-green-400 rounded border border-green-500/30">
                                            UID: {email?.uid}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-300 truncate">
                                        {email?.subject || "(No Subject)"}
                                    </h3>
                                    <p className="text-gray-400 text-sm line-clamp-2">
                                        {email?.body || ""}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {renderDate(email?.date)}
                                    </span>
                                    <button
                                        onClick={(e) => deleteEmail(e, email.uid)}
                                        className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
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
        </div>
    );
}
