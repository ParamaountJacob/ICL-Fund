import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, FileCheck, FileWarning, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { uploadDocument, getDocuments, deleteDocument, type Document } from '../lib/documents';
import type { DocumentType } from '../lib/supabase';

interface DocumentForm {
  displayName: string;
  file: File | null;
}

const PPMEdit: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState<DocumentForm>({ displayName: '', file: null });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments('ppm');
      setError(null);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!newDocument.file || !newDocument.displayName) {
        throw new Error('Please provide both a name and file');
      }

      await uploadDocument(
        'ppm',
        newDocument.displayName,
        newDocument.file,
        documents.length
      );

      setNewDocument({ displayName: '', file: null });
      await loadDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
      setError(error instanceof Error ? error.message : 'Failed to add document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteDocument(id);
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      // Get filename without extension
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      // Convert to title case and replace hyphens/underscores with spaces
      const displayName = fileName
        .replace(/[-_]/g, ' ')
        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      
      setNewDocument({
        displayName,
        file
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDocument(prev => ({ ...prev, displayName: e.target.value }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (sourceIndex === targetIndex) return;

    try {
      const newDocs = [...documents];
      const [movedDoc] = newDocs.splice(sourceIndex, 1);
      newDocs.splice(targetIndex, 0, movedDoc);

      // Update orders in database
      for (let i = 0; i < newDocs.length; i++) {
        await uploadDocument('ppm', newDocs[i].displayName, new File([], newDocs[i].fileName), i);
      }

      await loadDocuments();
    } catch (error) {
      console.error('Error reordering documents:', error);
      alert('Failed to reorder documents. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="pt-20">
        <section className="py-24 md:py-32">
          <div className="section">
            <div className="text-center">Loading documents...</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <section className="py-24 md:py-32">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h1 className="heading-xl">Edit PPM Documents</h1>
            </div>

            {error && (
              <div className="bg-red-500/10 p-4 rounded-lg mb-8 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-500">{error}</p>
              </div>
            )}

            <div className="bg-surface p-8 rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-6">Add New Document</h2>
              <div className="flex gap-4 mb-8">
                <input
                  type="text"
                  value={newDocument.displayName}
                  onChange={handleNameChange}
                  placeholder="Document Name"
                  className="flex-1 bg-background border-0 border-b border-graphite px-4 py-2 focus:ring-0 focus:border-gold text-text-primary"
                />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdfUpload"
                />
                <label
                  htmlFor="pdfUpload"
                  className="button-gold px-4 py-2 cursor-pointer"
                >
                  Choose PDF
                </label>
                <button
                  onClick={handleAddDocument}
                  disabled={saving || !newDocument.file || !newDocument.displayName}
                  className="button px-4 py-2 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              </div>

              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={handleDragOver}
                    className="p-4 bg-accent rounded-lg flex items-center justify-between group hover:border-gold/50 border border-transparent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-5 h-5 text-text-secondary cursor-move" />
                      <FileText className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-semibold">{doc.displayName}</p>
                        <p className="text-sm text-text-secondary">{doc.fileName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-text-secondary hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PPMEdit;