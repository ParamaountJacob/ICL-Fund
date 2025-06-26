import React, { useState } from 'react';
import { Building2, CreditCard, ArrowRight, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { update_application_onboarding_status } from '../lib/supabase';

interface BankRoutingDetailsProps {
  applicationId: string;
  onComplete: () => void;
}

const BankRoutingDetails: React.FC<BankRoutingDetailsProps> = ({ applicationId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirmation = async () => {
    setLoading(true);
    try {
        await update_application_onboarding_status(applicationId, 'plaid_pending');

        // Create notification to admin about the wire transfer completion
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
                notificationType: 'funds_pending',
                message: `Investor has initiated a wire transfer for application ${applicationId} and confirmed wire details. Awaiting your verification of funds receipt.`
              }),
            }
          );
          
          if (!response.ok) {
            console.error('Error sending admin notification:', await response.text());
          }
        } catch (notifError) {
          console.error('Error sending admin notification:', notifError);
          // Log the error but don't block the user's flow
        }

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
                notificationType: 'funds_pending',
                message: `FUNDS PENDING: Investor has completed wire transfer for application ${applicationId}. ADMIN ACTION REQUIRED: Please verify funds receipt before proceeding to bank connection.`
              }),
            }
          );
          
          if (!response.ok) {
            console.error('Error sending admin notification:', await response.text());
          }
        } catch (notifError) {
          console.error('Error sending admin notification:', notifError);
        }
      
      setConfirmed(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error confirming bank details:', error);
      alert('There was an error confirming your bank details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <span>Reference: "ICL Investment - {applicationId.substring(0, 8)}"</span>
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
          className={`px-8 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors w-full md:w-auto ${
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
            <ChevronRight className="w-5 h-5" />
          )}
          {loading ? 'Processing...' : confirmed ? 'Confirmed' : 'I Have Completed the Wire Transfer'}
        </button>
      </div>
    </div>
  );
};

export default BankRoutingDetails;