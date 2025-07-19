import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const BUCKET = 'tim-data-room';
const USERNAME = 'Admin';
const PASSWORD = '000';

export default function DataRoom() {
    const [authenticated, setAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [files, setFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [requestText, setRequestText] = useState('');
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [viewingFile, setViewingFile] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState('documents');
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (authenticated) fetchFiles();
    }, [authenticated]);

    async function fetchFiles() {
        const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
        if (error) setError(error.message);
        else setFiles(data ?? []);
    }

    function sanitizeFileName(name: string): string {
        // More aggressive sanitization for Supabase storage
        return name
            .normalize('NFD') // Normalize unicode
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^\w.-]/g, '_') // Replace any non-alphanumeric (except dots/hyphens) with underscore
            .replace(/_+/g, '_') // Replace multiple underscores with single
            .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
            .toLowerCase(); // Convert to lowercase for consistency
    }

    async function uploadFile(file: File) {
        setUploading(true);
        setError('');

        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}_${sanitizedName}`;

        console.log('Original filename:', file.name);
        console.log('Sanitized filename:', sanitizedName);
        console.log('Final filename:', fileName);

        const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true });
        setUploading(false);
        if (error) {
            console.error('Upload error:', error);
            setError(error.message);
        } else {
            fetchFiles();
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
    }

    function handleDrag(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    }

    async function handleDelete(name: string) {
        if (!window.confirm('Delete this file?')) return;
        const { error } = await supabase.storage.from(BUCKET).remove([name]);
        if (error) setError(error.message);
        else fetchFiles();
    }

    async function handleRequestSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setRequestSuccess(false);
        const { error } = await supabase.from('data_room_requests').insert({
            request: requestText,
            created_at: new Date().toISOString(),
        });
        if (error) setError(error.message);
        else {
            setRequestSuccess(true);
            setRequestText('');
        }
    }

    function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (username === USERNAME && password === PASSWORD) {
            setAuthenticated(true);
            setError('');
        } else {
            setError('Invalid username or password');
        }
    }

    function openFileViewer(file: any) {
        setViewingFile(file);
    }

    function closeFileViewer() {
        setViewingFile(null);
    }

    // Helper function to extract version from filename
    function extractVersion(filename: string): string {
        const versionMatch = filename.match(/v(\d+\.?\d*)/i);
        return versionMatch ? `v${versionMatch[1]}` : 'v1.0';
    }

    // Helper function to get file thumbnail icon
    function getFileIcon(filename: string): string {
        if (filename.includes('.pdf')) return '📄';
        if (filename.includes('.doc') || filename.includes('.docx')) return '📝';
        if (filename.includes('.xls') || filename.includes('.xlsx')) return '📊';
        if (filename.includes('.ppt') || filename.includes('.pptx')) return '📈';
        if (filename.includes('.zip') || filename.includes('.rar')) return '📦';
        if (filename.includes('.jpg') || filename.includes('.png') || filename.includes('.jpeg')) return '🖼️';
        if (filename.includes('.mp4') || filename.includes('.mov')) return '🎥';
        return '📄';
    }

    // Helper function to get recently updated files (last 7 days)
    function getRecentlyUpdated(): any[] {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return files
            .filter(f => new Date(f.updated_at || f.created_at) > sevenDaysAgo)
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 5);
    }

    // Helper function to filter files by search query
    function getFilteredFiles(): any[] {
        let filtered = selectedFolder === 'all'
            ? files
            : files.filter(f => f.name.toLowerCase().includes(selectedFolder));

        if (searchQuery.trim()) {
            filtered = filtered.filter(f =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                extractVersion(f.name).toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }

    const folders = [
        { id: 'all', name: 'All Files', icon: '📁' },
        { id: 'prospecting', name: 'Prospecting', icon: '🎯' },
        { id: 'presentation', name: 'Presentation', icon: '💼' },
        { id: 'closing', name: 'Closing Docs', icon: '📋' },
        { id: 'training', name: 'Training', icon: '🎓' }
    ];

    const filteredFiles = getFilteredFiles();
    const recentlyUpdated = getRecentlyUpdated();

    function renderDocumentsPage() {
        return (
            <>
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search documents by name or version..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800/70 text-white border border-gold/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold/60">
                            🔍
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Recently Updated Section */}
                {recentlyUpdated.length > 0 && !searchQuery && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gold mb-3 flex items-center gap-2">
                            ⚡ Recently Updated
                        </h3>
                        <div className="grid gap-2">
                            {recentlyUpdated.map((f) => (
                                <div
                                    key={`recent-${f.name}`}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gold/5 border border-gold/20 hover:bg-gold/10 transition-all group cursor-pointer"
                                    onClick={() => openFileViewer(f)}
                                >
                                    <div className="text-lg">{getFileIcon(f.name)}</div>
                                    <div className="flex-1">
                                        <div className="font-medium text-white/90 text-sm">
                                            {f.name.replace(/^\d+_/, '')}
                                        </div>
                                        <div className="text-xs text-gold/70">
                                            Updated {new Date(f.updated_at || f.created_at).toLocaleDateString()} • {extractVersion(f.name)}
                                        </div>
                                    </div>
                                    <div className="text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to view
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {folders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${selectedFolder === folder.id
                                    ? 'bg-gold/20 text-gold border border-gold/40'
                                    : 'bg-gray-800/50 text-white/70 border border-gray-700 hover:bg-gray-700/50'
                                    }`}
                            >
                                <span>{folder.icon}</span>
                                {folder.name}
                                <span className="text-xs opacity-60">
                                    ({folder.id === 'all' ? files.length : files.filter(f => f.name.toLowerCase().includes(folder.id)).length})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-gold font-semibold mb-3">📤 Upload Files</label>
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${dragActive
                            ? 'border-gold bg-gold/10 scale-105'
                            : uploading
                                ? 'border-yellow-500/50 bg-yellow-500/5'
                                : 'border-gold/30 hover:border-gold/60 bg-black/30 hover:bg-black/50'
                            }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="text-4xl mb-3">
                            {uploading ? '⏳' : dragActive ? '📥' : '📁'}
                        </div>
                        <div className="text-lg mb-2 text-white">
                            {uploading
                                ? 'Uploading...'
                                : dragActive
                                    ? 'Drop file here'
                                    : 'Drag and drop or click to select'
                            }
                        </div>
                        <div className="text-sm text-white/60 space-y-1">
                            <div>💡 Pro tips for better organization:</div>
                            <div>• Include folder name: "prospecting_pitchdeck.pdf"</div>
                            <div>• Add version numbers: "pitchdeck_v2.1.pdf"</div>
                            <div>• Use descriptive names: "closing_subscription_agreement_v1.0.pdf"</div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gold flex items-center gap-2">
                            📋 {selectedFolder === 'all' ? 'All Documents' : folders.find(f => f.id === selectedFolder)?.name}
                            <span className="text-sm text-white/60">({filteredFiles.length})</span>
                            {searchQuery && (
                                <span className="text-sm text-gold/70">• Searching "{searchQuery}"</span>
                            )}
                        </h2>
                        <button
                            onClick={fetchFiles}
                            className="text-sm px-3 py-1 rounded bg-gold/20 text-gold hover:bg-gold/30 transition"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                    <div className="grid gap-3">
                        {filteredFiles.length === 0 && (
                            <div className="text-center py-8 text-white/60 border border-gold/10 rounded-lg">
                                <div className="text-3xl mb-2">
                                    {searchQuery ? '�' : '�📂'}
                                </div>
                                <div>
                                    {searchQuery
                                        ? `No documents found matching "${searchQuery}"`
                                        : 'No files in this folder yet'
                                    }
                                </div>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-2 text-sm text-gold hover:text-gold/80 transition"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                        {filteredFiles.map((f) => (
                            <div
                                key={f.name}
                                className="flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-gold/10 text-white/90 border border-gold/10 hover:border-gold/40 transition-all group"
                            >
                                {/* Enhanced File Icon with Preview Thumbnail */}
                                <div className="relative">
                                    <div className="text-3xl">
                                        {getFileIcon(f.name)}
                                    </div>
                                    {/* Version Badge */}
                                    <div className="absolute -top-1 -right-1 bg-gold/90 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                                        {extractVersion(f.name)}
                                    </div>
                                </div>

                                {/* File Details */}
                                <div className="flex-1 cursor-pointer"
                                    onClick={() => openFileViewer(f)}>
                                    <div className="font-medium hover:text-gold transition text-base">
                                        {f.name.replace(/^\d+_/, '').replace(/v\d+\.?\d*/i, '').replace(/_{2,}/g, '_').replace(/^_|_$/g, '')}
                                    </div>
                                    <div className="text-xs text-white/60 mt-1 flex items-center gap-3">
                                        <span>📅 {new Date(f.updated_at || f.created_at).toLocaleDateString()}</span>
                                        <span>🔄 {new Date(f.updated_at || f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>👁️ Click to view</span>
                                        {f.metadata?.size && (
                                            <span>📊 {(f.metadata.size / 1024 / 1024).toFixed(1)}MB</span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openFileViewer(f)}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition flex items-center gap-1"
                                    >
                                        👁️ View
                                    </button>
                                    <a
                                        href={supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl}
                                        download
                                        className="px-3 py-1.5 text-xs rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition flex items-center gap-1"
                                    >
                                        ⬇️ Download
                                    </a>
                                    <button
                                        className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex items-center gap-1"
                                        onClick={() => handleDelete(f.name)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    function renderFAQPage() {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gold mb-6">Sales Team FAQ</h2>

                <div className="space-y-4">
                    <div className="bg-black/50 rounded-lg p-4 border border-gold/20">
                        <h3 className="font-semibold text-gold mb-2">What is Inner Circle Lending Fund #1?</h3>
                        <p className="text-white/80 text-sm">Inner Circle Lending is a private capital fund focused on providing alternative lending solutions. As Fund #1, we're establishing our track record in the private lending space with carefully selected investment opportunities.</p>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 border border-gold/20">
                        <h3 className="font-semibold text-gold mb-2">What are the minimum investment amounts?</h3>
                        <p className="text-white/80 text-sm">Minimum investments typically start at $25,000 for qualified investors. Specific terms are outlined in the subscription agreement and vary based on the investment structure.</p>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 border border-gold/20">
                        <h3 className="font-semibold text-gold mb-2">Who can invest in the fund?</h3>
                        <p className="text-white/80 text-sm">We work with accredited investors and qualified purchasers. All investors must complete KYC/AML verification and meet suitability requirements outlined in our investor documentation.</p>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 border border-gold/20">
                        <h3 className="font-semibold text-gold mb-2">What documents do investors need to sign?</h3>
                        <p className="text-white/80 text-sm">Primary documents include the subscription agreement and promissory note. Additional KYC/AML forms and disclosures may be required based on investment structure.</p>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 border border-gold/20">
                        <h3 className="font-semibold text-gold mb-2">How long is the investment commitment?</h3>
                        <p className="text-white/80 text-sm">Investment terms vary by opportunity. Typical commitments range from 12-36 months with specific terms outlined in the promissory note and investment documentation.</p>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 border border-gold/20">
                        <h3 className="font-semibold text-gold mb-2">What compliance requirements should I know?</h3>
                        <p className="text-white/80 text-sm">Always verify accreditation status before discussing specific investment opportunities. Ensure all required disclosures are provided and never guarantee returns or make performance promises.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
                <div className="bg-black/70 rounded-xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-4">🔒</div>
                        <h1 className="text-2xl font-bold text-gold mb-2">Data Room Access</h1>
                        <p className="text-white/70">Enter credentials to continue</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full p-3 rounded bg-gray-800 text-white border border-gold/30 focus:outline-none focus:border-gold mb-3"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-3 rounded bg-gray-800 text-white border border-gold/30 focus:outline-none focus:border-gold mb-4"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full px-4 py-3 rounded bg-gold/90 text-black font-semibold hover:bg-yellow-500 transition"
                        >
                            Access Data Room
                        </button>
                    </form>
                    {error && <div className="text-red-400 text-center mt-3 text-sm">{error}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
            <div className="max-w-4xl mx-auto bg-black/70 backdrop-blur-sm rounded-xl shadow-2xl p-8 mt-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gold mb-2">Sales Resource Center</h1>
                        <p className="text-white/80">
                            Secure repository for raising capital for Inner Circle Lending Fund #1.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-white/60">Files: {files.length}</div>
                        <button
                            onClick={() => setAuthenticated(false)}
                            className="text-xs text-red-400 hover:text-red-600 mt-1"
                        >
                            Exit Room
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mb-6 border-b border-gold/20">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setCurrentPage('documents')}
                            className={`pb-3 px-1 text-sm font-medium transition ${currentPage === 'documents'
                                ? 'text-gold border-b-2 border-gold'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            📁 Documents
                        </button>
                        <button
                            onClick={() => setCurrentPage('faq')}
                            className={`pb-3 px-1 text-sm font-medium transition ${currentPage === 'faq'
                                ? 'text-gold border-b-2 border-gold'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            ❓ FAQ
                        </button>
                        <button
                            onClick={() => setCurrentPage('guide')}
                            className={`pb-3 px-1 text-sm font-medium transition ${currentPage === 'guide'
                                ? 'text-gold border-b-2 border-gold'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            📖 Sales Guide
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                {currentPage === 'documents' && renderDocumentsPage()}
                {currentPage === 'faq' && renderFAQPage()}
                {currentPage === 'guide' && (
                    <div className="bg-black/50 rounded-lg p-6 border border-gold/20">
                        <h2 className="text-xl font-semibold text-gold mb-4">Sales Process Guide</h2>
                        <div className="space-y-4 text-white/80">
                            <div>
                                <h3 className="font-semibold text-gold/90 mb-2">🎯 Step 1: Prospecting</h3>
                                <p className="text-sm">Use pitch deck and one-pagers for initial meetings. Focus on qualifying accreditation status early.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gold/90 mb-2">💼 Step 2: Presentation</h3>
                                <p className="text-sm">Share detailed terms sheet and FAQ responses. Address risk questions thoroughly with provided materials.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gold/90 mb-2">📋 Step 3: Closing</h3>
                                <p className="text-sm">Provide subscription agreement and promissory note. Ensure all required disclosures are completed.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gold/90 mb-2">⚠️ Compliance Reminders</h3>
                                <p className="text-sm">Never guarantee returns. Always verify accreditation. Provide all required risk disclosures.</p>
                            </div>
                        </div>
                    </div>
                )}

                {currentPage === 'documents' && (
                    <div className="bg-black/50 rounded-lg p-6 border border-gold/20 mt-6">
                        <h3 className="font-semibold text-gold mb-3 flex items-center gap-2">
                            💬 Document Requests & Inquiries
                        </h3>
                        <form onSubmit={handleRequestSubmit}>
                            <textarea
                                className="w-full p-4 rounded-lg bg-gray-800/70 text-white border border-gold/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 mb-4 transition"
                                placeholder="Request specific documents, ask questions about existing materials, or suggest additional content for this data room..."
                                value={requestText}
                                onChange={e => setRequestText(e.target.value)}
                                rows={4}
                                required
                            />
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-white/50">
                                    All requests are logged and reviewed by authorized personnel
                                </div>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-gold/90 text-black font-semibold hover:bg-yellow-500 transition shadow-lg"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                        {requestSuccess && (
                            <div className="mt-3 p-3 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
                                ✅ Request submitted successfully and will be reviewed promptly.
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                <div className="text-xs text-white/40 mt-8 border-t border-gold/10 pt-4 text-center">
                    🛡️ This data room is private and confidential. All access is logged. Please do not forward links without authorization.
                </div>
            </div>

            {/* Enhanced Document Viewer Popup */}
            {viewingFile && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-black/90 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col border border-gold/30">
                        <div className="flex items-center justify-between p-4 border-b border-gold/20">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="text-3xl">
                                        {getFileIcon(viewingFile.name)}
                                    </div>
                                    <div className="absolute -top-1 -right-1 bg-gold/90 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                                        {extractVersion(viewingFile.name)}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        {viewingFile.name.replace(/^\d+_/, '').replace(/v\d+\.?\d*/i, '').replace(/_{2,}/g, '_').replace(/^_|_$/g, '')}
                                    </h3>
                                    <div className="text-sm text-white/60 flex items-center gap-3">
                                        <span>📅 {new Date(viewingFile.updated_at || viewingFile.created_at).toLocaleDateString()}</span>
                                        <span>🔄 {new Date(viewingFile.updated_at || viewingFile.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="text-gold">✨ {extractVersion(viewingFile.name)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={supabase.storage.from(BUCKET).getPublicUrl(viewingFile.name).data.publicUrl}
                                    download
                                    className="px-4 py-2 text-sm rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition flex items-center gap-1"
                                >
                                    ⬇️ Download
                                </a>
                                <button
                                    onClick={closeFileViewer}
                                    className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex items-center gap-1"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={supabase.storage.from(BUCKET).getPublicUrl(viewingFile.name).data.publicUrl}
                                className="w-full h-full border-0"
                                title={viewingFile.name}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
