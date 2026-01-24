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

function DocumentCard({ document, onDelete }) {
    const uploadedAt = new Date(document.uploaded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const fileIcon = document.file_type === 'pdf' ? '📄' : '📝';

    return (
        <div className="neon-card group">
            <div className="flex items-start gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                        background: 'rgba(0,255,255,0.1)',
                        border: '1px solid rgba(0,255,255,0.2)',
                    }}
                >
                    {fileIcon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate group-hover:text-[var(--neon-cyan)] transition-colors">{document.original_filename}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        <span className="text-[var(--neon-pink)]">{document.chunk_count}</span> chunks • {uploadedAt}
                    </p>
                </div>
                <button
                    onClick={() => onDelete(document.id)}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--neon-red)] hover:bg-[rgba(255,0,102,0.1)] rounded-lg border border-transparent hover:border-[var(--neon-red)] transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function SearchResult({ result }) {
    return (
        <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-4 border border-[rgba(255,0,255,0.1)] hover:border-[rgba(255,0,255,0.3)] transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--neon-pink)]">{result.filename}</span>
                <span className="text-xs text-[var(--neon-cyan)] bg-[rgba(0,255,255,0.1)] px-2 py-1 rounded-full">
                    {Math.round(result.relevance_score * 100)}% match
                </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{result.content}</p>
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
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
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

    async function handleSearch(e) {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const results = await knowledgeAPI.search(searchQuery);
            setSearchResults(results);
        } catch (err) {
            setError(err.message);
        } finally {
            setSearching(false);
        }
    }

    return (
        <div className="fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Knowledge Base</h1>
                <p className="text-[var(--text-muted)] mt-2">
                    Upload FAQ documents to enhance AI response quality
                </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="mb-6 bg-[rgba(255,0,102,0.1)] border border-[var(--neon-red)] rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--neon-red)] flex-shrink-0" />
                    <span className="text-[var(--neon-red)]">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-[var(--neon-red)] hover:opacity-70">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {uploadSuccess && (
                <div className="mb-6 bg-[rgba(0,255,136,0.1)] border border-[var(--neon-green)] rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-green)]" style={{ filter: 'drop-shadow(0 0 5px var(--neon-green))' }} />
                    <span className="text-[var(--neon-green)]">Document uploaded successfully!</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload & Documents */}
                <div className="space-y-6">
                    {/* Upload Area */}
                    <div className="neon-card">
                        <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-cyan)] mb-4">Upload Document</h2>
                        <label className="block">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            <div className="border-2 border-dashed border-[rgba(0,255,255,0.3)] rounded-xl p-10 text-center cursor-pointer hover:border-[var(--neon-cyan)] hover:bg-[rgba(0,255,255,0.05)] transition-all group">
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="neon-spinner mb-4"></div>
                                        <p className="text-[var(--text-muted)]">Processing document...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="w-12 h-12 text-[var(--neon-cyan)] mb-4 group-hover:scale-110 transition-transform" style={{ filter: 'drop-shadow(0 0 10px var(--neon-cyan))' }} />
                                        <p className="font-semibold text-lg">Drop files here or click to upload</p>
                                        <p className="text-sm text-[var(--text-muted)] mt-2">PDF or TXT files only</p>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Document List */}
                    <div className="neon-card">
                        <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-pink)] mb-4">
                            Documents <span className="text-[var(--neon-cyan)]">({documents.length})</span>
                        </h2>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-[var(--bg-tertiary)] rounded-xl h-20 flex items-center justify-center">
                                        <div className="neon-spinner"></div>
                                    </div>
                                ))}
                            </div>
                        ) : documents.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {documents.map((doc) => (
                                    <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Database className="w-12 h-12 mx-auto text-[var(--neon-pink)] opacity-30 mb-4" />
                                <p className="text-[var(--text-muted)]">No documents uploaded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="space-y-6">
                    <div className="neon-card">
                        <h2 className="text-xl font-bold font-['Orbitron'] text-[var(--neon-purple)] mb-4">Search Knowledge Base</h2>
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-purple)]" />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="neon-input pl-12"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searching || !searchQuery.trim()}
                                className="btn-gradient px-6 disabled:opacity-50"
                            >
                                {searching ? <div className="neon-spinner w-5 h-5 !border-2"></div> : 'Search'}
                            </button>
                        </form>

                        {/* Search Results */}
                        {searchResults && (
                            <div className="mt-6">
                                <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--neon-purple)] to-transparent mb-4"></div>
                                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">
                                    <span className="text-[var(--neon-cyan)]">{searchResults.results.length}</span> results for "<span className="text-[var(--neon-pink)]">{searchResults.query}</span>"
                                </h3>
                                {searchResults.results.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {searchResults.results.map((result, i) => (
                                            <SearchResult key={i} result={result} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Zap className="w-12 h-12 mx-auto text-[var(--neon-purple)] opacity-30 mb-4" />
                                        <p className="text-[var(--text-muted)]">No matches found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
