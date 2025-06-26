import React, { useState } from 'react';
import { supabase, update_application_onboarding_status, createOrUpdateDocumentSignature } from '../lib/supabase';
import { FileText, Loader2, FileSignature } from 'lucide-react';

interface PromissoryNoteSigningStepProps {
  applicationId: string;
  onComplete: () => void;
}

const PromissoryNoteSigningStep: React.FC<PromissoryNoteSigningStepProps> = ({ applicationId, onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmation = async () => {
    setLoading(true);
    try {
      console.log('Starting promissory note signing process');
      
      if (applicationId && applicationId !== 'undefined') {
        // Use the new consolidated function instead
        await createOrUpdateDocumentSignature(
          applicationId, 
          'promissory_note', 
          'investor_signed',
          true,  // Send admin notification
          true   // Auto-complete status update
        );
      }
     
      onComplete();
    } catch (err) {
      console.error('Error confirming submission:', err);
      alert('There was an error confirming your submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
      <div className="flex items-center justify-center mb-8">
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mr-4">
          <FileSignature className="w-8 h-8 text-gold" />
        </div>
        <div className="text-left">
          <h2 className="text-2xl font-semibold text-gray-900">Promissory Note</h2>
          <p className="text-gray-600">
            Please review and sign your promissory note
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
        <h3 className="font-semibold text-gray-800 mb-4">Promissory Note Details:</h3>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-600">Document Type:</span>
            <span className="font-medium">Promissory Note</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-600">Status:</span>
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending Signature</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center mb-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-700 mb-2">Promissory Note Document Preview</p>
        <p className="text-gray-600 mt-2">
          When integrated with SignRequest, the document signing interface will appear here.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={handleConfirmation} 
              disabled={loading} 
              className="button py-3 px-8 flex items-center justify-center gap-2 w-full" 
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSignature className="w-5 h-5" />
              )}
              {loading ? 'Signing...' : 'Sign Promissory Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromissoryNoteSigningStep;