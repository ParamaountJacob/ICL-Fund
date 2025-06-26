import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase, get_investment_application_by_id, update_application_onboarding_status } from '../lib/supabase';
import { 
  FileSignature, 
  Building2, 
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { SuccessModal } from '../components/SuccessModal';
import PromissoryNoteSigningStep from '../components/PromissoryNoteSigningStep';
import BankRoutingDetails from '../components/BankRoutingDetails';
import TemporaryPlaid from '../components/TemporaryPlaid';

const PromissoryNoteFlow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Promissory Note, 2: Bank Details, 3: Plaid
  const [showSuccessModal, setShowSuccessModal] = useState(false);  
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string>('');
  const [applicationDetails, setApplicationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const controlsStep1 = useAnimationControls();
  const controlsStep2 = useAnimationControls();
  const controlsStep3 = useAnimationControls();

  useEffect(() => {
    // Get application ID and step from URL parameters
    const appId = searchParams.get('applicationId');
    const step = searchParams.get('step');
    
    if (appId && appId !== 'undefined') {
      setApplicationId(appId);
      
      // Set current step based on URL parameter if provided
      if (step) {
        switch(step) {
          case 'wire_details':
            setCurrentStep(2);
            break;
          case 'bank_connection':
            setCurrentStep(3);
            break;
          case 'funds_pending':
            setCurrentStep(3);
            break;
        }
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/profile');
        return;
      }
      
      setUser(user);
      
      // If we have an application ID, fetch the application details
      if (appId && appId !== 'undefined') {
        fetchApplicationDetails(appId);
      } else {
        // If no application ID, check if user has an active application
        checkActiveApplication(user.id);
      }
    });
  }, [navigate, searchParams]);

  const fetchApplicationDetails = async (appId: string) => {
    try {
      setLoading(true);
      const application = await get_investment_application_by_id(appId);
      
      if (application) {
        setApplicationDetails(application);
        setApplicationStatus(application.status);
        
        // Set current step based on application status - FIX: include promissory_note_sent status
        if (application.status === 'promissory_note_pending' || application.status === 'promissory_note_sent' || application.status === 'documents_signed') {
          setCurrentStep(1);
        } else if (application.status === 'bank_details_pending' || application.status === 'funds_pending') {
          setCurrentStep(2);
        } else if (application.status === 'plaid_pending' || application.status === 'investor_onboarding_complete') {
          setCurrentStep(3);
        }
        
      } else {
        // No application found with this ID
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveApplication = async (userId: string) => {
    try {
      setLoading(true);
      // Query for active applications that need promissory note signing
      const { data, error } = await supabase
        .from('investment_applications')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'promissory_note_pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error checking active application:', error);
        return;
      }
      
      if (data) {
        setApplicationId(data.id);
        setApplicationDetails(data);
      } else {
        // No active application found
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error checking active application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromissoryNoteComplete = () => {
    setCurrentStep(2); // Move to bank details step
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setApplicationStatus('bank_details_pending');
   
    // Send admin notification
    if (applicationId && applicationId !== 'undefined') {
      try {
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              applicationId,
              notificationType: 'promissory_note_signed',
              message: `Investor has signed the promissory note for application ${applicationId}. Please verify the signature and wire transfer details.`
            }),
          }
        );
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
    
    // Animate completion of step 1
    controlsStep1.start({ 
      backgroundColor: '#f0fdf4',  // green-50
      borderColor: '#22c55e'       // green-500
    });
  };

  const handleBankDetailsComplete = () => {
    setCurrentStep(3); // Move to Plaid step
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setApplicationStatus('plaid_pending');
    
    // Animate completion of step 2
    controlsStep2.start({ 
      backgroundColor: '#f0fdf4',  // green-50
      borderColor: '#22c55e'       // green-500
    });
  };

  const handlePlaidComplete = () => {
    setApplicationStatus('investor_onboarding_complete');
    
    // Animate completion of step 3
    controlsStep3.start({ 
      backgroundColor: '#f0fdf4',  // green-50
      borderColor: '#22c55e'       // green-500
    });
    
    setSuccessTitle('Investment Process Complete');
    setSuccessMessage('Thank you for completing your bank connection. Our team will now review and activate your investment, typically within 1-2 business days.');
    setShowSuccessModal(true);
  };

  // Function to track progress through the steps
  const getProgressPercentage = () => {
    return ((currentStep - 1) / 2) * 100;
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (loading) {
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

  if (!applicationId && !showSuccessModal) {
    return (
      <div className="pt-20 min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-24 md:pt-12">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-4">No Active Application</h1>
            <p className="text-text-secondary mb-8">
              You don't have an active application that requires a promissory note. 
              Please start a new investment application or contact support if you believe this is an error.
            </p>
            <button 
              onClick={() => navigate('/investor-info')} 
              className="button"
            >
              {loading ? 'Processing...' : confirmed ? 'Confirmed' : 'I Have Completed the Wire Transfer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-24 md:pt-12">
        <div className="text-center mb-4 md:mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {currentStep === 1 && <FileSignature className="w-8 h-8 text-gold" />}
            {(currentStep === 2) && <Building2 className="w-8 h-8 text-gold" />}
            {currentStep === 3 && <CreditCard className="w-8 h-8 text-gold" />}
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
              {currentStep === 1 && 'Promissory Note Signing'}
              {currentStep === 2 && 'Complete Wire Transfer'}
              {currentStep === 3 && 'Connect Bank Account'}
            </h1>
          </div>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {currentStep === 1 && 'Sign your promissory note to continue. You\'ll be automatically directed to the next step.'}
            {currentStep === 2 && 'Review wire instructions and complete your wire transfer'}
            {currentStep === 3 && 'Connect your bank account for future transactions'}
          </p>
        </div>
        
        <div className="mb-8">
          <div className="mb-8 md:mb-12">            
            {/* Simplified Progress Indicator - Just circles and bottom labels */}
            <div className="flex justify-center items-center mb-8">
              <div className="flex items-center">
                {/* Step 1 */}
                <motion.div 
                  animate={controlsStep1}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= 1 || applicationStatus !== 'promissory_note_pending' ? 'bg-gold text-background' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > 1 || applicationStatus === 'bank_details_pending' || applicationStatus === 'funds_pending' || 
                   applicationStatus === 'plaid_pending' || applicationStatus === 'investor_onboarding_complete' ? 
                   <CheckCircle className="w-5 h-5" /> : <span className="text-lg font-medium">1</span>}
                </motion.div>
                
                {/* Connector */}
                <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-gold' : 'bg-gray-200'}`}></div>
                
                {/* Step 2 */}
                <motion.div 
                  animate={controlsStep2}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-gold text-background' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > 2 || applicationStatus === 'plaid_pending' || 
                   applicationStatus === 'investor_onboarding_complete' ? 
                   <CheckCircle className="w-5 h-5" /> : <span className="text-lg font-medium">2</span>}
                </motion.div>
                
                {/* Connector */}
                <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-gold' : 'bg-gray-200'}`}></div>
                
                {/* Step 3 */}
                <motion.div 
                  animate={controlsStep3}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-gold text-background' : 'bg-gray-200 text-gray-600'
                }`}>
                  {applicationStatus === 'investor_onboarding_complete' ? 
                   <CheckCircle className="w-5 h-5" /> : <span className="text-lg font-medium">3</span>}
                </motion.div>
              </div>
            </div>
            
            {/* Step Labels */}
            <div className="flex justify-center mt-2">
              <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                <div className="text-center">
                  <span className={`text-sm ${currentStep === 1 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                    Sign Promissory Note
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-sm ${currentStep === 2 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                    Complete Wire Transfer
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-sm ${currentStep === 3 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                    Connect Bank
                  </span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit" 
                transition={{ duration: 0.4 }}
              >
                <PromissoryNoteSigningStep
                  applicationId={applicationId!}
                  onComplete={handlePromissoryNoteComplete}
                />
              </motion.div>
            )}
            
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit" 
                transition={{ duration: 0.4 }}
              >
                <BankRoutingDetails
                  applicationId={applicationId!}
                  onComplete={handleBankDetailsComplete}
                />
              </motion.div>
            )}
            
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit" 
                transition={{ duration: 0.4 }}
              >
                <TemporaryPlaid
                  applicationId={applicationId!}
                  onComplete={handlePlaidComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              navigate('/dashboard');
            }}
            title={successTitle || "Investment Process Complete"}
            message={successMessage || "Congratulations! You have completed all the steps in the investment process. Your investment is now being processed, and you will receive updates in your dashboard."}
          />
        </div>
      </div>
    </div>
  );
};

export default PromissoryNoteFlow;