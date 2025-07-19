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
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (authenticated) fetchFiles();
    }, [authenticated]);

    async function fetchFiles() {
        const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
        if (error) setError(error.message);
        else setFiles(data ?? []);
    }

    async function uploadFile(file: File) {
        setUploading(true);
        setError('');
        const fileName = `${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true });
        setUploading(false);
        if (error) setError(error.message);
        else fetchFiles();
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
                        <h1 className="text-3xl font-bold text-gold mb-2">Tim's Capital Access Room</h1>
                        <p className="text-white/80">
                            <strong>Welcome, Tim.</strong> This room contains all core documents, pitch assets, and reference materials for capital partner outreach, webinars, and investor calls.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-white/60">Files: {files.length}</div>
                        <button
                            onClick={() => setAuthenticated(false)}
                            className="text-xs text-red-400 hover:text-red-600 mt-1"
                        >
                            Lock Room
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-gold font-semibold mb-3">Upload Files</label>
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
                        <div className="text-sm text-white/60">
                            Supports all file types • Auto-timestamps filenames
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
                        <h2 className="text-xl font-semibold text-gold">Document Library</h2>
                        <button
                            onClick={fetchFiles}
                            className="text-sm px-3 py-1 rounded bg-gold/20 text-gold hover:bg-gold/30 transition"
                        >
                            Refresh
                        </button>
                    </div>
                    <div className="grid gap-3">
                        {files.length === 0 && (
                            <div className="text-center py-8 text-white/60 border border-gold/10 rounded-lg">
                                <div className="text-3xl mb-2">📂</div>
                                <div>No files uploaded yet</div>
                            </div>
                        )}
                        {files.map((f) => (
                            <div
                                key={f.name}
                                className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gold/10 text-white/90 border border-gold/10 hover:border-gold/40 transition-all group"
                            >
                                <div className="text-2xl">
                                    {f.name.includes('.pdf') ? '📄' :
                                        f.name.includes('.doc') ? '📝' :
                                            f.name.includes('.xls') ? '📊' :
                                                f.name.includes('.ppt') ? '📈' :
                                                    f.name.includes('.zip') ? '📦' : '📄'}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{f.name.replace(/^\d+_/, '')}</div>
                                    <div className="text-xs text-white/50">
                                        {new Date(f.updated_at || f.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 text-xs rounded bg-gold/20 text-gold hover:bg-gold/30 transition"
                                    >
                                        Download
                                    </a>
                                    <button
                                        className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                        onClick={() => handleDelete(f.name)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/50 rounded-lg p-6 border border-gold/20">
                    <h3 className="font-semibold text-gold mb-3 flex items-center gap-2">
                        💡 Request Documents or Suggest Improvements
                    </h3>
                    <form onSubmit={handleRequestSubmit}>
                        <textarea
                            className="w-full p-4 rounded-lg bg-gray-800/70 text-white border border-gold/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 mb-4 transition"
                            placeholder="What documents do you need? Any suggestions for improving this data room?"
                            value={requestText}
                            onChange={e => setRequestText(e.target.value)}
                            rows={4}
                            required
                        />
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-white/50">
                                Requests are tracked and will be reviewed promptly
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
                            ✅ Request submitted successfully! We'll review it promptly.
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                <div className="text-xs text-white/40 mt-8 border-t border-gold/10 pt-4 text-center">
                    🛡️ This data room is private and confidential. All access is logged. Please do not forward links without authorization.
                </div>
            </div>
        </div>
    );
}
