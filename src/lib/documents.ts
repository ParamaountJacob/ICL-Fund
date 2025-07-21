import { supabase } from './client';
import { sanitizeFileName } from './utils';
import type { DocumentType } from './client';

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

// Document Signature Management
export interface DocumentSignature {
  id: string;
  application_id: string;
  document_type: DocumentType;
  status: string;
  created_at: string;
  updated_at: string;
}

export const documentService = {
  // Create or update document signature (moved from monolithic supabase.ts)
  async createOrUpdateDocumentSignature(
    applicationId: string,
    documentType: DocumentType,
    status: string = 'pending',
    sendAdminNotification: boolean = true,
    autoComplete: boolean = true
  ): Promise<DocumentSignature> {
    try {
      // First check if a document signature record already exists
      const { data: existingSignature, error: checkError } = await supabase
        .from('document_signatures')
        .select('id')
        .eq('application_id', applicationId)
        .eq('document_type', documentType)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let result;
      if (existingSignature) {
        // Update existing signature
        const { data, error } = await supabase
          .from('document_signatures')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSignature.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new signature
        const { data, error } = await supabase
          .from('document_signatures')
          .insert({
            application_id: applicationId,
            document_type: documentType,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Send admin notification if requested
      if (sendAdminNotification && status === 'signed') {
        const notificationSent = await this.sendAdminNotification(applicationId, documentType);
        if (!notificationSent) {
          console.warn(`Document signature recorded but admin notification failed for ${applicationId}`);
        }
      }

      // Auto-complete application if all documents are signed
      if (autoComplete && status === 'signed') {
        await this.checkAndCompleteApplication(applicationId);
      }

      return result;
    } catch (error) {
      console.error('Error creating/updating document signature:', error);
      throw error;
    }
  },

  // Send admin notification
  async sendAdminNotification(applicationId: string, documentType: DocumentType): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'document_signed',
          applicationId,
          documentType,
          message: `Document ${documentType} has been signed for application ${applicationId}`
        }
      });

      if (error) {
        console.error('Error sending admin notification:', error);
        return false; // Return false to indicate failure but don't break the flow
      }

      return true; // Return true to indicate success
    } catch (error) {
      console.error('Error invoking admin notification function:', error);
      return false; // Return false to indicate failure
    }
  },

  // Check if all documents are signed and complete application
  async checkAndCompleteApplication(applicationId: string) {
    try {
      // Get all required document types for this application
      const requiredDocs: DocumentType[] = ['subscription_agreement', 'promissory_note'];

      // Check if all required documents are signed
      const { data: signatures } = await supabase
        .from('document_signatures')
        .select('document_type, status')
        .eq('application_id', applicationId)
        .in('document_type', requiredDocs);

      const signedDocs = signatures?.filter(sig => sig.status === 'signed').map(sig => sig.document_type) || [];
      const allDocsSigned = requiredDocs.every(doc => signedDocs.includes(doc));

      if (allDocsSigned) {
        // Update application status to completed
        const { error } = await supabase
          .from('investment_applications')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        if (error) {
          console.error('Error completing application:', error);
        }
      }
    } catch (error) {
      console.error('Error checking application completion:', error);
    }
  }
};

// Legacy function for backward compatibility
export const createOrUpdateDocumentSignature = documentService.createOrUpdateDocumentSignature;