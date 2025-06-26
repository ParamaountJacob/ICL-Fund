import React, { useState } from 'react';
import { supabase, update_application_onboarding_status, createOrUpdateDocumentSignature } from '../lib/supabase';
import { FileText, Loader2, FileSignature } from 'lucide-react';
import { SuccessModal } from './SuccessModal';

interface DocumentSigningStepProps {
  applicationId: string;
  onComplete: () => void;
}

const DocumentSigningStep: React.FC<DocumentSigningStepProps> = ({ applicationId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleConfirmation = async () => {
    setLoading(true);
    try {
      // Create document signature with status 'investor_signed'
      await createOrUpdateDocumentSignature(
        applicationId, 
        'subscription_agreement', 
        'investor_signed',
        false, // Don't send admin notification yet
        false  // Don't auto-complete status update
      );
      
      // Send notification to admin about signed document
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              applicationId,
              notificationType: 'subscription_agreement_signed',
              message: `Investor has signed the subscription agreement for application ${applicationId}. Please proceed with creating and sending the promissory note.`
            }),
          }
        );
        
        // Update application status to documents_signed to trigger investment creation
        await update_application_onboarding_status(
          applicationId,
          'documents_signed'
        );
      } catch (error) {
        console.error('Error sending notification:', error);
      }
      
      setShowSuccessModal(true);
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
              {loading ? 'Submitting...' : 'Sign Promissory Note'}
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onComplete(); 
        }}
        title="Subscription Agreement Signed"
        message="Your subscription agreement has been signed successfully. Our team will review it and you'll be notified when it's time to proceed to the next step in the investment process."
      />
    </div>
  );
};

export default DocumentSigningStep;