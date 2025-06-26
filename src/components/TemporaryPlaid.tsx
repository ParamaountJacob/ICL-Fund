import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { SuccessModal } from './SuccessModal';
import { update_application_onboarding_status } from '../lib/supabase';

interface TemporaryPlaidProps {
  applicationId: string;
  onComplete: () => void;
}

const TemporaryPlaid: React.FC<TemporaryPlaidProps> = ({ applicationId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const banks = [
    { id: 'chase', name: 'Chase', logo: 'https://logo.clearbit.com/chase.com' },
    { id: 'bofa', name: 'Bank of America', logo: 'https://logo.clearbit.com/bankofamerica.com' },
    { id: 'wells', name: 'Wells Fargo', logo: 'https://logo.clearbit.com/wellsfargo.com' },
    { id: 'citi', name: 'Citibank', logo: 'https://logo.clearbit.com/citibank.com' },
    { id: 'capital', name: 'Capital One', logo: 'https://logo.clearbit.com/capitalone.com' },
    { id: 'usbank', name: 'US Bank', logo: 'https://logo.clearbit.com/usbank.com' },
    { id: 'pnc', name: 'PNC Bank', logo: 'https://logo.clearbit.com/pnc.com' },
    { id: 'td', name: 'TD Bank', logo: 'https://logo.clearbit.com/td.com' }
  ];

  const handleConfirmation = async () => {
    if (!selectedBank) {
      alert('Please select a bank to continue');
      return;
    }
    
    setLoading(true);
    try {
      // Update application status to investor_onboarding_complete
      await update_application_onboarding_status(
        applicationId,
        'investor_onboarding_complete'
      );
      
      // Only attempt to send notification if we have a valid applicationId
      if (applicationId && applicationId !== 'undefined') {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-notification`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                applicationId, 
                notificationType: 'investor_onboarding_complete',
                message: `Investor has completed bank connection for application ${applicationId}. ADMIN ACTION REQUIRED: Please review and activate the investment.`
              }),
            }
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error sending admin notification:', errorText);
            throw new Error(`Failed to send admin notification: ${errorText}`);
          }
        } catch (notifError) {
          console.error('Error sending admin notification:', notifError);
          // Log the error but don't block the user's flow
        }
      }
      
      setConfirmed(true);
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('There was an error completing your onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
      <div className="flex items-center justify-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <div className="text-left">
          <h2 className="text-2xl font-semibold text-gray-900">Connect Your Bank Account</h2>
          <p className="text-gray-600">
            Securely link your bank account for future transactions
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Secure Connection</h3>
        </div>
        <p className="text-gray-700 mb-4">
          We use Plaid to securely connect to your bank. Your credentials are never stored on our servers.
        </p>
        <div className="flex items-center justify-center bg-white p-4 rounded-lg border border-gray-300">
          <img 
            src="https://plaid.com/assets/img/logo-dark.svg" 
            alt="Plaid Logo" 
            className="h-8"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Select Your Bank</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {banks.map(bank => (
            <button
              key={bank.id}
              onClick={() => setSelectedBank(bank.id)}
              className={`p-4 rounded-lg border transition-all ${
                selectedBank === bank.id 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex flex-col items-center">
                <img 
                  src={bank.logo} 
                  alt={`${bank.name} Logo`} 
                  className="h-8 mb-2"
                  onError={(e) => {
                    // Fallback if logo doesn't load
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x40?text=' + bank.name;
                  }}
                />
                <span className="text-sm font-medium text-gray-900">{bank.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleConfirmation}
          disabled={loading || confirmed || !selectedBank}
          className={`px-8 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors ${
            confirmed 
              ? 'bg-green-600 text-white' 
              : !selectedBank
              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
              : 'bg-gold text-background hover:bg-gold/90'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : confirmed ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <ArrowRight className="w-5 h-5"/>
          )}
          {loading ? 'Processing...' : confirmed ? 'Completed' : 'Confirm Fund Transfer'}
        </button>
      </div>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onComplete();
        }}
        title="Fund Transfer Confirmation Received" 
        message="Thank you for connecting your bank account. Your investment is now being processed for activation. This typically takes 1-2 business days. You'll receive a notification when your investment is activated."
      />
    </div>
  );
};

export default TemporaryPlaid;