import { useState, useEffect, useRef } from 'react';
import {
    Upload,
    FileText,
    Search,
    Trash2,
    Loader2,
    X,
    AlertCircle,
    CheckCircle,
    Zap,
    Database,
} from 'lucide-react';
import { knowledgeAPI } from '../services/api';
import pdfIcon from '../assets/pdf_icon.png';

function DocumentCard({ document, onDelete }) {
    const uploadedAt = new Date(document.uploaded_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const isPdf = document.file_type === 'pdf';

    return (
        <div className="neon-card p-4 hover:border-[var(--neon-cyan)]/50 transition-all group/card">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden ${!isPdf ? 'bg-[#007acc]' : ''}`}>
                    {isPdf ? (
                        <img src={pdfIcon} alt="PDF" className="w-full h-full object-contain p-1" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <FileText className="w-5 h-5 text-white/90" />
                            <span className="text-[8px] font-bold text-white mt-0.5 tracking-tighter">TXT</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {document.original_filename}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                            {document.file_type}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">•</span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                            {uploadedAt}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onDelete(document.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 rounded transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function SearchResult({ result }) {
    return (
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--neon-purple)]/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[var(--neon-purple)]" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">{result.filename}</span>
                </div>
                <span className="text-[10px] font-bold text-[var(--neon-cyan)]">
                    {Math.round(result.relevance_score * 100)}% Match
                </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3 italic bg-[var(--bg-tertiary)]/30 p-3 rounded-lg border border-[var(--border-color)]/50">
                "{result.content}"
            </p>
        </div>
    );
}

export default function KnowledgeBase() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    async function fetchDocuments() {
        try {
            const data = await knowledgeAPI.getAll();
            setDocuments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only PDF and TXT files are allowed');
            return;
        }

        setUploading(true);
        setError(null);
        setUploadSuccess(false);

        try {
            await knowledgeAPI.upload(file);
            setUploadSuccess(true);
            fetchDocuments();
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleDelete(documentId) {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await knowledgeAPI.delete(documentId);
            setDocuments(documents.filter((d) => d.id !== documentId));
        } catch (err) {
            setError(err.message);
        }
    }

    // Filter documents by filename for real-time overview
    const filteredDocuments = documents.filter(doc =>
        doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fade-in max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-['Orbitron'] gradient-text">Knowledge Base</h1>
                <p className="text-[var(--text-muted)] mt-2 italic">
                    Train your AI assistant with documentation for better support accuracy.
                </p>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-red-500 text-sm font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500/50 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {uploadSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">Document added successfully!</span>
                </div>
            )}

            {/* Search Section (Top) */}
            <div className="relative w-full mb-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-purple)] z-10" />
                <input
                    type="text"
                    placeholder="Search documents by filename..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="neon-input pl-12 py-4 text-base focus:border-[var(--neon-purple)]"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Lists (2 units) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="neon-card">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-color)]">
                            <h2 className="text-lg font-bold font-['Orbitron']">Stored Documents</h2>
                            <span className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded font-mono text-[var(--neon-cyan)]">
                                {filteredDocuments.length} Files
                            </span>
                        </div>
                        {loading ? (
                            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--neon-cyan)]" /></div>
                        ) : filteredDocuments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredDocuments.map((doc) => (
                                    <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-[var(--text-muted)]">
                                {searchQuery ? (
                                    <>
                                        <Search className="w-12 h-12 mx-auto opacity-10 mb-4" />
                                        <p>No documents match "{searchQuery}"</p>
                                    </>
                                ) : (
                                    <>
                                        <Database className="w-12 h-12 mx-auto opacity-10 mb-4" />
                                        <p>Your knowledge base is empty.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Upload Section (1 unit) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="neon-card">
                        <h2 className="text-lg font-bold font-['Orbitron'] mb-4 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-[var(--neon-cyan)]" />
                            New Document
                        </h2>
                        <label className="block">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            <div className={`
                                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                                ${uploading
                                    ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5'
                                    : 'border-[var(--border-color)] hover:border-[var(--neon-cyan)] hover:bg-[var(--bg-tertiary)]'
                                }
                            `}>
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 text-[var(--neon-cyan)] animate-spin mx-auto" />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-[var(--text-muted)] opacity-50 mx-auto mb-2" />
                                        <p className="text-sm font-semibold">Drop or Click</p>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-1">PDF / TXT only</p>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
