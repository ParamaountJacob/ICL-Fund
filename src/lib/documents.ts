import { supabase } from './supabase';
import { sanitizeFileName } from './utils';
import type { DocumentType } from './supabase';

export interface Document {
  id: string;
  displayName: string;
  fileName: string;
  order: number;
  updatedAt: string;
}

export async function uploadDocument(
  type: DocumentType,
  displayName: string,
  file: File,
  order: number
): Promise<void> {
  try {
    const sanitizedFileName = sanitizeFileName(file.name);
    const storagePath = `documents/${type}/${sanitizedFileName}`;
    
    // Create a new File object with the sanitized name
    const sanitizedFile = new File([file], sanitizedFileName, {
      type: file.type,
      lastModified: file.lastModified,
    });

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, sanitizedFile);

    if (uploadError) throw uploadError;

    const { error } = await supabase.rpc('update_document_with_order', {
      doc_type: type,
      doc_display_name: displayName,
      doc_order: order,
      file_name: sanitizedFileName,
      storage_path: storagePath
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document. Please try again.');
  }
}

export async function getDocuments(type: DocumentType): Promise<Document[]> {
  try {
    const { data, error } = await supabase.rpc('get_documents_by_type', {
      doc_type: type
    });

    if (error) throw error;

    return data.map(doc => ({
      id: doc.id,
      displayName: doc.display_name,
      fileName: doc.file_name,
      order: doc.order,
      updatedAt: doc.updated_at
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Failed to fetch documents. Please try again.');
  }
}

export async function downloadDocument(
  type: DocumentType,
  id: string
): Promise<{ fileName: string; data: Blob }> {
  try {
    const { data: document, error } = await supabase.rpc('get_document_by_id', {
      doc_id: id,
      doc_type: type
    });

    if (error) throw error;
    if (!document || !document.length) {
      console.error('Document not found in database');
      throw new Error('Document not found');
    }

    const doc = document[0];
    if (!doc.storage_path) {
      console.error('Document has no storage path');
      throw new Error('Document storage path not found');
    }

    const { data, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);

    if (downloadError) {
      console.error('Storage download error:', downloadError);
      throw downloadError;
    }

    if (!data) {
      console.error('No data returned from storage');
      throw new Error('File not found in storage');
    }

    return {
      fileName: doc.file_name,
      data: data
    };
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to download document. Please try again.');
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('delete_document', {
      doc_id: id
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document. Please try again.');
  }
}