import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Enhanced styles for premium hero section and animations
const styles = `
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .sophisticated-bg {
    background: 
      radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.02) 0%, transparent 50%),
      linear-gradient(135deg, rgba(255, 215, 0, 0.01) 0%, transparent 50%, rgba(255, 215, 0, 0.01) 100%),
      #000000;
    background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
  }

  .scroll-indicator {
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    60% { transform: translateY(-4px); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

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
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploadTargetFolder, setUploadTargetFolder] = useState('');
    const [showReplaceDialog, setShowReplaceDialog] = useState(false);
    const [replaceTargetFile, setReplaceTargetFile] = useState<any>(null);
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

    async function uploadFile(file: File, targetFolder: string = '', isReplace: boolean = false, existingFile?: any) {
        setUploading(true);
        setError('');

        let finalFileName: string;

        if (isReplace && existingFile) {
            // For replacement, increment version
            const currentVersion = extractVersion(existingFile.name);
            const baseFileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            const extension = file.name.split('.').pop();
            const newVersion = incrementVersion(currentVersion);

            const sanitizedBase = sanitizeFileName(baseFileName);
            finalFileName = `${Date.now()}_${targetFolder ? targetFolder + '_' : ''}${sanitizedBase}_${newVersion}.${extension}`;
        } else {
            // For new upload, use folder prefix and default version
            const sanitizedName = sanitizeFileName(file.name);
            const baseFileName = sanitizedName.replace(/\.[^/.]+$/, "");
            const extension = sanitizedName.split('.').pop();

            // Check if filename already has version, if not add v1.0
            const hasVersion = /v\d+\.?\d*/i.test(baseFileName);
            const versionSuffix = hasVersion ? '' : '_v1.0';

            finalFileName = `${Date.now()}_${targetFolder ? targetFolder + '_' : ''}${baseFileName}${versionSuffix}.${extension}`;
        }

        console.log('Upload details:', {
            originalName: file.name,
            targetFolder,
            isReplace,
            finalFileName
        });

        const { error } = await supabase.storage.from(BUCKET).upload(finalFileName, file, { upsert: true });
        setUploading(false);

        if (error) {
            console.error('Upload error:', error);
            setError(error.message);
        } else {
            fetchFiles();
            // Close dialogs
            setShowUploadDialog(false);
            setShowReplaceDialog(false);
            setPendingFile(null);
            setReplaceTargetFile(null);
        }
    }

    function incrementVersion(currentVersion: string): string {
        // Extract numbers from version string like "v1.0" or "v2.1"
        const match = currentVersion.match(/v(\d+)\.?(\d*)/i);
        if (match) {
            const major = parseInt(match[1]);
            const minor = match[2] ? parseInt(match[2]) : 0;
            return `v${major}.${minor + 1}`;
        }
        return 'v1.1'; // Default increment
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show folder selection dialog
        setPendingFile(file);
        setShowUploadDialog(true);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
            // Show folder selection dialog for dropped files too
            setPendingFile(e.dataTransfer.files[0]);
            setShowUploadDialog(true);
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
                                    <button
                                        onClick={() => {
                                            setReplaceTargetFile(f);
                                            setShowReplaceDialog(true);
                                        }}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition flex items-center gap-1"
                                    >
                                        🔄 New Version
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
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-gold mb-8">Investor FAQ</h2>

                <div className="grid gap-6">
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">What is Inner Circle Lending?</h3>
                        <p className="text-white/70 leading-relaxed">Inner Circle Lending is a family-run 506(c) private lending firm that provides 11-15% fixed annual returns through secured business loans. We serve borrowers who value certainty, speed, and discretion over the lowest rate, creating premium yield opportunities for our investors.</p>
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">What are the minimum investment requirements?</h3>
                        <p className="text-white/70 leading-relaxed">Our minimum investment is $200,000. We offer tiered returns: Tier 1 ($200K-$349K) = 11-12%, Tier 2 ($350K-$499K) = 12-13%, Tier 3 ($500K-$999K) = 13-14%, Tier 4 ($1M+) = 14-15%. Two-year terms receive an additional 1% bonus.</p>
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">Who can invest with Inner Circle Lending?</h3>
                        <p className="text-white/70 leading-relaxed">We work exclusively with accredited investors who meet SEC qualification requirements. Our selective approach ensures we maintain high-quality relationships with sophisticated investors who understand private lending opportunities.</p>
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">How are returns structured and paid?</h3>
                        <p className="text-white/70 leading-relaxed">We offer fixed annual returns of 11-15% based on your investment tier. You can choose monthly, quarterly, or annual payment schedules. Returns are contractually guaranteed through promissory notes - simple, transparent, and secure.</p>
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">What investment terms are available?</h3>
                        <p className="text-white/70 leading-relaxed">We offer 12-month and 24-month investment terms. Two-year commitments receive a 1% bonus on returns. Our short-term deployment model (typically 6 months or less) allows for rapid capital reallocation and real-time optimization.</p>
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">How are investments protected?</h3>
                        <p className="text-white/70 leading-relaxed">Your investment is secured through collateralized loans, surety bonds, and reserve funds. Wayne Griswold personally oversees every deal. Our rigorous due diligence process and focus on privacy-premium borrowers provides multiple layers of protection.</p>
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">What makes Inner Circle Lending different?</h3>
                        <p className="text-white/70 leading-relaxed">We're not a startup fund. We're a family-run business with decades of experience, focusing on privacy-premium niches where discretion commands higher yields. Our agile approach with short-term loans allows us to pivot quickly and maintain consistent performance.</p>
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                        <h3 className="font-semibold text-gold mb-4 text-lg">Can I use retirement funds or tax strategies?</h3>
                        <p className="text-white/70 leading-relaxed">Yes! We help investors redirect dormant 401(k)s, tax payments, or crypto holdings into our secured lending platform. Our tax repositioning strategies can transform tax liabilities into yield-generating assets while maintaining IRS compliance.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="bg-black/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gold/30 transform transition-all duration-700 hover:scale-[1.02]">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4 animate-pulse">🔒</div>
                        <h1 className="text-2xl font-bold text-gold mb-2 tracking-wide">Secure Access</h1>
                        <p className="text-white/50 text-sm">Data Room Authentication</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full p-3 rounded-xl bg-gray-800/60 text-white border border-gold/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all duration-300 placeholder:text-gray-300"
                                required
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full p-3 rounded-xl bg-gray-800/60 text-white border border-gold/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all duration-300 placeholder:text-gray-300"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-gold/80 to-yellow-500/80 text-black font-semibold hover:from-gold hover:to-yellow-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gold/30"
                        >
                            Enter Data Room
                        </button>
                    </form>
                    {error && (
                        <div className="text-red-400 text-center mt-4 p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-xs">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen sophisticated-bg">
            {/* Premium Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
                {/* Hero Content */}
                <div className="text-center z-10 w-full max-w-4xl mx-auto">
                    <div className="animate-fadeIn">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gold mb-3 sm:mb-4 tracking-wide">
                            ICL Data Room
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/70 mb-4 sm:mb-6 font-light tracking-wide px-4">
                            Secure Repository for Inner Circle Lending
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/60 text-xs sm:text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                <span>Secure</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                                <span>Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                <span>Private</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-white/50 mb-1 sm:mb-2 text-xs sm:text-sm tracking-wide">Scroll to Access</div>
                    <div className="scroll-indicator text-gold text-lg sm:text-xl">⬇</div>
                </div>

                {/* Exit Button */}
                <button
                    onClick={() => setAuthenticated(false)}
                    className="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 text-red-400/60 hover:text-red-400 transition-colors duration-200 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 bg-black/30 backdrop-blur-sm px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-red-400/20 hover:border-red-400/40"
                >
                    🚪 <span className="hidden sm:inline">Exit Room</span>
                </button>
            </div>

            {/* Main Data Room Content */}
            <div className="bg-black">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gold mb-1 sm:mb-2 tracking-wide">Investment Materials</h2>
                            <p className="text-white/60 text-base sm:text-lg">
                                Access documentation and resources for qualified investors.
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-xs sm:text-sm text-white/50 mb-1">Total Files: {files.length}</div>
                            <div className="text-xs text-gold/70">Last Updated: {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="mb-6 sm:mb-8 border-b border-gold/20">
                        <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto">
                            <button
                                onClick={() => setCurrentPage('documents')}
                                className={`pb-3 sm:pb-4 px-1 sm:px-2 text-sm sm:text-base font-medium transition-all duration-300 whitespace-nowrap ${currentPage === 'documents'
                                    ? 'text-gold border-b-2 border-gold'
                                    : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                📁 Documents
                            </button>
                            <button
                                onClick={() => setCurrentPage('faq')}
                                className={`pb-3 sm:pb-4 px-1 sm:px-2 text-sm sm:text-base font-medium transition-all duration-300 whitespace-nowrap ${currentPage === 'faq'
                                    ? 'text-gold border-b-2 border-gold'
                                    : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                ❓ FAQ
                            </button>
                            <button
                                onClick={() => setCurrentPage('guide')}
                                className={`pb-3 sm:pb-4 px-1 sm:px-2 text-sm sm:text-base font-medium transition-all duration-300 whitespace-nowrap ${currentPage === 'guide'
                                    ? 'text-gold border-b-2 border-gold'
                                    : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                📖 Investment Guide
                            </button>
                        </div>
                    </div>

                    {/* Page Content with Smooth Transitions */}
                    <div className="transition-all duration-500 ease-in-out">
                        {currentPage === 'documents' && (
                            <div className="animate-fadeIn">
                                {renderDocumentsPage()}
                            </div>
                        )}
                        {currentPage === 'faq' && (
                            <div className="animate-fadeIn">
                                {renderFAQPage()}
                            </div>
                        )}
                        {currentPage === 'guide' && (
                            <div className="animate-fadeIn space-y-10">
                                <h2 className="text-3xl font-semibold text-gold mb-8">Investment Guide</h2>

                                {/* Investment Tiers */}
                                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-gold/10">
                                    <h3 className="font-semibold text-gold mb-6 text-xl">📊 Investment Tiers & Returns</h3>
                                    <div className="grid md:grid-cols-2 gap-6 text-white/80">
                                        <div className="bg-gray-800/30 rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                                            <h4 className="font-semibold text-gold/90 mb-3 text-lg">Tier 1: $200K - $349K</h4>
                                            <p className="text-base">11% (1-year) | 12% (2-year)</p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                                            <h4 className="font-semibold text-gold/90 mb-3 text-lg">Tier 2: $350K - $499K</h4>
                                            <p className="text-base">12% (1-year) | 13% (2-year)</p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                                            <h4 className="font-semibold text-gold/90 mb-3 text-lg">Tier 3: $500K - $999K</h4>
                                            <p className="text-base">13% (1-year) | 14% (2-year)</p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                                            <h4 className="font-semibold text-gold/90 mb-3 text-lg">Tier 4: $1M+</h4>
                                            <p className="text-base">14% (1-year) | 15% (2-year)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Investment Process */}
                                <div className="bg-black/50 rounded-lg p-6 border border-gold/20">
                                    <h3 className="font-semibold text-gold mb-4">🎯 Investment Process</h3>
                                    <div className="space-y-4 text-white/80">
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">Step 1: Qualification & Selection</h4>
                                            <p className="text-sm">Verify accredited investor status. Choose investment amount ($200K minimum) and term (12 or 24 months). Two-year terms receive +1% bonus rate.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">Step 2: Documentation</h4>
                                            <p className="text-sm">Receive promissory note with contractually fixed annual yield. Simple, transparent structure with no complex equity arrangements.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">Step 3: Capital Deployment</h4>
                                            <p className="text-sm">Funds deployed across short-term (1-6 month) secured business loans to privacy-focused borrowers who value discretion over lowest rates.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">Step 4: Returns</h4>
                                            <p className="text-sm">Receive consistent, fixed payouts on your preferred schedule: monthly, quarterly, or annually. No surprises, no market volatility.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Value Propositions */}
                                <div className="bg-black/50 rounded-lg p-6 border border-gold/20">
                                    <h3 className="font-semibold text-gold mb-4">💡 Key Selling Points</h3>
                                    <div className="space-y-4 text-white/80">
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">🛡️ Security & Protection</h4>
                                            <p className="text-sm">Family-run 506(c) firm with decades of experience. Collateralized loans, surety bonds, reserve funds. Wayne Griswold personally oversees every deal.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">� Strategic Advantages</h4>
                                            <p className="text-sm">Short-term deployment model allows rapid capital reallocation. Privacy-premium niches generate superior yields. Agile response to market opportunities.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">💰 Tax Optimization</h4>
                                            <p className="text-sm">Self-directed retirement strategies: direct 401(k)/IRA funds into high-yield investments. Tax repositioning: transform tax payments into yield-generating assets.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gold/90 mb-2">📈 Predictable Performance</h4>
                                            <p className="text-sm">Fixed returns independent of market volatility. Consistent 11-15% annual yields. No correlation to stock market ups and downs.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Compliance Notes */}
                                <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                                    <h4 className="font-semibold text-red-400 mb-2">⚠️ Compliance Reminders</h4>
                                    <div className="text-red-300/80 text-sm space-y-1">
                                        <p>• Verify accredited investor status before discussing specific opportunities</p>
                                        <p>• Provide all required risk disclosures and disclaimers</p>
                                        <p>• Past performance does not guarantee future results</p>
                                        <p>• All investments involve risk of loss</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

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
                    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
                        <div className="bg-black/95 w-full h-full flex flex-col border-0">
                            <div className="flex items-center justify-between p-4 border-b border-gold/20 bg-black/90">
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
                )}                {/* Upload Folder Selection Dialog */}
                {showUploadDialog && pendingFile && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-black/90 rounded-xl shadow-2xl max-w-md w-full border border-gold/30">
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gold mb-4 flex items-center gap-2">
                                    📁 Choose Upload Destination
                                </h3>
                                <p className="text-white/80 mb-4">
                                    Uploading: <span className="text-gold font-medium">{pendingFile.name}</span>
                                </p>

                                {/* Folder Selection */}
                                <div className="space-y-2 mb-6">
                                    {folders.filter(f => f.id !== 'all').map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => setUploadTargetFolder(folder.id)}
                                            className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-center gap-3 ${uploadTargetFolder === folder.id
                                                ? 'bg-gold/20 border-gold/40 text-gold'
                                                : 'bg-gray-800/50 border-gray-700 text-white/70 hover:bg-gray-700/50'
                                                }`}
                                        >
                                            <span className="text-xl">{folder.icon}</span>
                                            <div>
                                                <div className="font-medium">{folder.name}</div>
                                                <div className="text-xs opacity-60">
                                                    {folder.id === 'prospecting' && 'First impression materials'}
                                                    {folder.id === 'presentation' && 'For interested prospects'}
                                                    {folder.id === 'closing' && 'Legal paperwork for commitments'}
                                                    {folder.id === 'training' && 'Sales training & compliance'}
                                                </div>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Custom Folder Option */}
                                    <div>
                                        <button
                                            onClick={() => setUploadTargetFolder('custom')}
                                            className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-center gap-3 ${uploadTargetFolder === 'custom'
                                                ? 'bg-gold/20 border-gold/40 text-gold'
                                                : 'bg-gray-800/50 border-gray-700 text-white/70 hover:bg-gray-700/50'
                                                }`}
                                        >
                                            <span className="text-xl">✨</span>
                                            <div className="font-medium">Custom Folder</div>
                                        </button>

                                        {uploadTargetFolder === 'custom' && (
                                            <input
                                                type="text"
                                                placeholder="Enter folder name (e.g., 'legal', 'marketing')"
                                                className="w-full mt-2 p-3 rounded-lg bg-gray-800/70 text-white border border-gold/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition"
                                                onChange={(e) => setUploadTargetFolder(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowUploadDialog(false);
                                            setPendingFile(null);
                                            setUploadTargetFolder('');
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (pendingFile && uploadTargetFolder) {
                                                uploadFile(pendingFile, uploadTargetFolder, false);
                                            }
                                        }}
                                        disabled={!uploadTargetFolder}
                                        className="flex-1 px-4 py-2 rounded-lg bg-gold/90 text-black font-semibold hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Upload File
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Replace File / New Version Dialog */}
                {showReplaceDialog && replaceTargetFile && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-black/90 rounded-xl shadow-2xl max-w-md w-full border border-gold/30">
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gold mb-4 flex items-center gap-2">
                                    🔄 Create New Version
                                </h3>
                                <p className="text-white/80 mb-4">
                                    Creating new version of: <br />
                                    <span className="text-gold font-medium">
                                        {replaceTargetFile.name.replace(/^\d+_/, '').replace(/v\d+\.?\d*/i, '').replace(/_{2,}/g, '_').replace(/^_|_$/g, '')}
                                    </span>
                                </p>
                                <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                                    <div className="text-sm text-white/70">Current Version: <span className="text-gold">{extractVersion(replaceTargetFile.name)}</span></div>
                                    <div className="text-sm text-white/70">New Version: <span className="text-green-400">{incrementVersion(extractVersion(replaceTargetFile.name))}</span></div>
                                </div>

                                {/* Upload New Version */}
                                <div className="mb-6">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Extract folder from existing file name
                                                const folderMatch = replaceTargetFile.name.match(/^\d+_([^_]+)_/);
                                                const existingFolder = folderMatch ? folderMatch[1] : '';
                                                uploadFile(file, existingFolder, true, replaceTargetFile);
                                            }
                                        }}
                                        className="w-full p-3 rounded-lg bg-gray-800/70 text-white border border-gold/30 focus:outline-none focus:border-gold transition"
                                    />
                                    <p className="text-xs text-white/60 mt-2">
                                        💡 Select the updated file to create version {incrementVersion(extractVersion(replaceTargetFile.name))}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowReplaceDialog(false);
                                            setReplaceTargetFile(null);
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}