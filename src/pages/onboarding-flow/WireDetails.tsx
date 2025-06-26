import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, update_application_onboarding_status } from '../../lib/supabase';
import { Building2, CreditCard, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { SuccessModal } from '../../components/SuccessModal';

const WireDetails: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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

  const handleConfirmation = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    try {
      // Update application status to plaid_pending
      await update_application_onboarding_status(
        applicationId,
        'funds_pending'
      );
      
      setConfirmed(true);
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 1000);
    } catch (error) {
      console.error('Error confirming wire transfer:', error);
      alert('There was an error confirming your wire transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!applicationId || !user) {
    return (
      <div className="pt-20 min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-24 md:pt-12">
          <div className="flex items-center justify-center h-64">
            I Have Sent the Wire Transfer & Continue
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
            <Building2 className="w-8 h-8 text-gold" />
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
              Wire Transfer Instructions
            </h1>
          </div>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Review the wire transfer instructions for your investment
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-gray-900">Bank Routing Details</h2>
              <p className="text-gray-600">
                Please review the wire transfer instructions
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4 mb-8">
              <CreditCard className="w-6 h-6 text-gold" />
              <h3 className="text-xl font-semibold">Wire Instructions</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">
                    Bank Name
                  </label>
                  <p className="text-lg font-medium">First National Bank</p>
                </div>
                
                <div>
                  <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">
                    Account Name
                  </label>
                  <p className="text-lg font-medium">Inner Circle Lending LLC</p>
                </div>
                
                <div>
                  <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">
                    Account Number
                  </label>
                  <p className="text-lg font-medium">1234567890</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">
                    Routing Number
                  </label>
                  <p className="text-lg font-medium">021000021</p>
                </div>
                
                <div>
                  <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">
                    SWIFT Code
                  </label>
                  <p className="text-lg font-medium">FNBAUS33</p>
                </div>
                
                <div>
                  <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">
                    Bank Address
                  </label>
                  <p className="text-lg font-medium">123 Financial Street, New York, NY 10004</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Important Notes:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">•</span>
                <span>Please include your full name as it appears on your investment documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">•</span>
                <span>Reference: "ICL Investment - {applicationId?.substring(0, 8)}"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">•</span>
                <span>Funds typically clear within 1-2 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">•</span>
                <span>Please notify us after completing your wire transfer</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleConfirmation}
              disabled={loading || confirmed}
              className={`px-8 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors w-full max-w-md mx-auto ${
                confirmed 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gold text-background hover:bg-gold/90'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : confirmed ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              {loading ? 'Processing...' : confirmed ? 'Confirmed' : 'I Have Sent the Wire Transfer'}
            </button>
          </div>
        </div>

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/dashboard');
          }}
          title="Wire Transfer Confirmed" 
          message="Thank you for confirming your wire transfer. Our team will now verify receipt of your funds, which typically takes 1-2 business days. You'll receive a notification once we've confirmed receipt of your funds, at which point you'll be able to proceed to the next step."
        />
      </div>
    </div>
  );
};

export default WireDetails;