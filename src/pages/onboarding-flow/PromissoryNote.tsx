import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, update_application_onboarding_status } from '../../lib/supabase';
import { FileText, Loader2, FileSignature, ArrowRight } from 'lucide-react';

const PromissoryNote: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get application ID from URL parameters
    const appId = searchParams.get('applicationId');
    if (appId) {
      setApplicationId(appId);
    } else {
      // If no application ID is provided, redirect to dashboard
      navigate('/dashboard');
    }

    // Check if user is authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/profile');
      } else {
        setUser(user);
      }
    });
  }, [navigate, searchParams]);

  const handleSignPromissoryNote = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    try {
      // Update application status to bank_details_pending
      await update_application_onboarding_status(
        applicationId,
        'bank_details_pending' 
      );
      
      // Create a document signature record to represent the signed note
      try {
        await createDocumentSignature(
          applicationId,
          'promissory_note',
          'investor_signed'
        );
      } catch (sigError) {
        console.error('Error creating signature record:', sigError);
      }
      
      // Immediately redirect to wire details page
      navigate(`/onboarding-flow/wire-details?applicationId=${applicationId}`);
    } catch (err) {
      console.error('Error signing promissory note:', err);
      alert('There was an error signing the promissory note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!applicationId || !user) {
    return (
      <div className="pt-20 min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-24 md:pt-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-24 md:pt-12">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileSignature className="w-8 h-8 text-gold" />
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
              Promissory Note
            </h1>
          </div>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Review and sign your promissory note to continue the investment process
          </p>
        </div>

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
                  onClick={handleSignPromissoryNote} 
                  disabled={loading} 
                  className="button py-3 px-8 flex items-center justify-center gap-2 w-full max-w-md mx-auto"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileSignature className="w-5 h-5" />
                  )}
                  {loading ? 'Submitting...' : 'Sign & Continue to Wire Details'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PromissoryNote;