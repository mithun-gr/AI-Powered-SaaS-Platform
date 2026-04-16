"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FolderOpen, FileText, Download, Trash2, Eye, Search, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { documents as initialDocuments } from "@/lib/dummy-data";
import { fadeIn } from "@/lib/animations";
import { useSearch } from "@/lib/use-search";
import { incrementStorage, getUsage, PLAN_LIMITS } from "@/lib/usage-tracker";
import { fireLimitModal } from "@/components/global-limit-modal";

// Widen 'type' and 'folder' to string so uploaded files with arbitrary extensions don't error
type Doc = Omit<typeof initialDocuments[0], 'type' | 'folder'> & {
    type: string;
    folder: string;
    localUrl?: string;
};

const folders = [
    { id: "legal",     name: "Legal",     icon: "⚖️"  },
    { id: "insurance", name: "Insurance", icon: "🛡️" },
    { id: "property",  name: "Property",  icon: "🏠"  },
    { id: "tech",      name: "Tech",      icon: "💻"  },
    { id: "analytics", name: "Analytics", icon: "📊"  },
];

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
    const [docs, setDocs] = useState<Doc[]>(initialDocuments as Doc[]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { query, setQuery, results: searchResults, clearSearch, hasQuery } = useSearch(
        docs,
        ["name", "folder", "type"]
    );

    const filteredDocs = selectedFolder
        ? searchResults.filter((d) => d.folder === selectedFolder)
        : searchResults;

    const folderCounts = folders.map(f => ({
        ...f,
        count: docs.filter(d => d.folder === f.id).length,
    }));

    // Handle file upload (real file selection + state update)
    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        // Quota Check
        const currentUsage = getUsage();
        const limits = PLAN_LIMITS[currentUsage.plan] ?? PLAN_LIMITS.starter;
        
        // Calculate incoming size
        let incomingBytes = 0;
        Array.from(files).forEach(f => incomingBytes += f.size);
        const incomingMB = incomingBytes / (1024 * 1024);
        
        if (currentUsage.storageUsedMB + incomingMB > limits.storage * 1024) {
            fireLimitModal("storage", limits.label, limits.storage);
            return;
        }

        setUploading(true);
        setTimeout(() => {
            const newDocs: Doc[] = Array.from(files).map((file, i) => ({
                id: `upload-${Date.now()}-${i}`,
                name: file.name,
                type: file.name.split(".").pop()?.toUpperCase() || "FILE",
                size: formatBytes(file.size),
                folder: selectedFolder || "legal",
                uploadedAt: new Date().toISOString(),
                localUrl: URL.createObjectURL(file),
                url: "",
            }));
            setDocs(prev => [...newDocs, ...prev]);

            // ── Real-time usage tracking ──────────────────────────────────────────
            Array.from(files).forEach(f => incrementStorage(f.size));

            // ── Mark onboarding step done on first upload ─────────────────────────
            try {
                const done: string[] = JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]");
                if (!done.includes("docs")) {
                    localStorage.setItem("mrc_onboard_done", JSON.stringify([...done, "docs"]));
                }
            } catch {}

            setUploading(false);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        }, 1200);
    }, [selectedFolder]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDeleteDoc = (id: string) => {
        setDocs(prev => prev.filter(d => d.id !== id));
        setDeleteConfirm(null);
        if (previewDoc?.id === id) setPreviewDoc(null);
    };

    const handleDownload = (doc: Doc) => {
        if (doc.localUrl) {
            const a = document.createElement("a");
            a.href = doc.localUrl;
            a.download = doc.name;
            a.click();
        } else {
            // For static mock docs, create a text blob
            const blob = new Blob([`Document: ${doc.name}\nType: ${doc.type}\nUploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}`], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = doc.name;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Document Vault</h1>
                    <p className="text-muted-foreground mt-1">
                        Secure storage for all your important documents
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {uploadSuccess && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Uploaded!
                        </motion.div>
                    )}
                    <Button className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading…" : "Upload Document"}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={e => handleFiles(e.target.files)}
                    />
                </div>
            </div>

            {/* Security Notice */}
            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                    <p className="text-sm flex items-center gap-2">
                        <span className="text-primary">🔒</span>
                        <span>
                            <strong>Encrypted Storage:</strong> All documents are AES-256 encrypted and securely stored.
                        </span>
                    </p>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Folders Sidebar */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Folders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            <Button
                                variant={selectedFolder === null ? "default" : "ghost"}
                                className="w-full justify-between"
                                onClick={() => setSelectedFolder(null)}
                            >
                                <span className="flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4" /> All
                                </span>
                                <span className="text-xs opacity-70">{docs.length}</span>
                            </Button>
                            {folderCounts.map((folder) => (
                                <Button
                                    key={folder.id}
                                    variant={selectedFolder === folder.id ? "default" : "ghost"}
                                    className="w-full justify-between"
                                    onClick={() => setSelectedFolder(folder.id)}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{folder.icon}</span> {folder.name}
                                    </span>
                                    <span className="text-xs opacity-70">{folder.count}</span>
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Documents Grid */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Drag & Drop Upload Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                            dragOver ? "border-primary bg-primary/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/20"
                        }`}
                    >
                        {uploading ? (
                            <div className="flex items-center justify-center gap-2 text-zinc-400">
                                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                <span className="text-sm font-medium">Uploading files…</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-zinc-500">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm">Drop files here or <span className="text-primary font-semibold">click to browse</span></span>
                            </div>
                        )}
                    </div>

                    {/* Docs list with search */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                                <CardTitle>
                                    {selectedFolder ? folderCounts.find(f => f.id === selectedFolder)?.name : "All Documents"}
                                    <span className="ml-2 text-sm font-normal text-zinc-500">({filteredDocs.length})</span>
                                </CardTitle>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        placeholder="Search documents…"
                                        className="w-52 h-9 pl-9 pr-8 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-primary/50"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                    />
                                    {hasQuery && (
                                        <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredDocs.length > 0 ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {filteredDocs.map((doc, index) => (
                                        <motion.div
                                            key={doc.id}
                                            variants={fadeIn}
                                            initial="initial"
                                            animate="animate"
                                            custom={index}
                                        >
                                            <Card className="hover:border-primary/40 transition-all">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm mb-0.5 truncate">{doc.name}</h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {doc.size} • {new Date(doc.uploadedAt).toLocaleDateString("en-GB")}
                                                            </p>
                                                            <div className="flex gap-1.5 mt-3">
                                                                <Button size="sm" variant="outline" className="h-7 text-xs px-2.5"
                                                                    onClick={() => setPreviewDoc(doc)}>
                                                                    <Eye className="h-3 w-3 mr-1" /> View
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="h-7 text-xs px-2.5"
                                                                    onClick={() => handleDownload(doc)}>
                                                                    <Download className="h-3 w-3 mr-1" /> Download
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                    onClick={() => setDeleteConfirm(doc.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={FolderOpen}
                                    title={hasQuery ? "No documents match your search" : "No documents yet"}
                                    description={hasQuery ? "Try a different keyword." : "Upload your first document to get started"}
                                    action={
                                        <Button className="gap-2" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="h-4 w-4" /> Upload Document
                                        </Button>
                                    }
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewDoc && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setPreviewDoc(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-white">{previewDoc.name}</h2>
                                    <p className="text-xs text-zinc-500">{previewDoc.size} • {previewDoc.folder} • {new Date(previewDoc.uploadedAt).toLocaleDateString("en-GB")}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            {previewDoc.localUrl && previewDoc.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={previewDoc.localUrl} alt={previewDoc.name} className="w-full rounded-xl max-h-80 object-contain bg-zinc-900" />
                            ) : previewDoc.localUrl && previewDoc.name.endsWith(".pdf") ? (
                                <iframe src={previewDoc.localUrl} className="w-full h-80 rounded-xl border border-zinc-700" />
                            ) : (
                                <div className="bg-zinc-900 rounded-xl h-64 flex flex-col items-center justify-center text-zinc-600 border border-zinc-800">
                                    <FileText className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="text-sm font-medium text-zinc-400">{previewDoc.name}</p>
                                    <p className="text-xs mt-1">Preview not available for this file type</p>
                                </div>
                            )}
                            <div className="flex gap-2 mt-4">
                                <Button className="flex-1 gap-2" onClick={() => handleDownload(previewDoc)}>
                                    <Download className="h-4 w-4" /> Download
                                </Button>
                                <Button variant="outline" className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                                    onClick={() => { handleDeleteDoc(previewDoc.id); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
                        >
                            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="font-bold text-white text-lg mb-2">Delete Document?</h3>
                            <p className="text-sm text-zinc-500 mb-5">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteDoc(deleteConfirm)}>Delete</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
