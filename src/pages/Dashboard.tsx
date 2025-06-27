import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  supabase,
  getUserSignedDocuments,
  getUserLatestPendingApplication,
  type SignedDocument,
  user_has_active_investments
} from '../lib/supabase';
import { type InvestmentStatus } from '../types';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Wallet,
  PieChart,
  BarChart3,
  Info,
  User,
  Mail,
  Phone,
  Building,
  Edit,
  Save,
  MessageSquare,
  FileSignature,
  Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SuccessModal } from '../components/SuccessModal';

interface DocumentAccess {
  pitch_deck: boolean;
  ppm: boolean;
  wire_instructions: boolean;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'document_access' | 'investment';
  description: string;
  amount?: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
}

// Pre-cached sample data - no loading required
const SAMPLE_INVESTMENT_DATA = {
  totalInvested: 0,
  currentValue: 0,
  totalReturns: 0,
  monthlyReturn: 0,
  annualizedReturn: 0,
  nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  nextPaymentAmount: 0
};

const SAMPLE_RECENT_ACTIVITY: RecentActivity[] = [];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [activeApplication, setActiveApplication] = useState<any>(null);
  const [latestApplication, setLatestApplication] = useState<any>(null);
  const [documentAccess, setDocumentAccess] = useState<DocumentAccess>({
    pitch_deck: true,
    ppm: true, // Always accessible in dashboard
    wire_instructions: false // Not accessible in dashboard
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOnboardingNotification, setShowOnboardingNotification] = useState(false);
  const [showPendingApprovalNotification, setShowPendingApprovalNotification] = useState(false);
  const [investmentApproved, setInvestmentApproved] = useState(false);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const [hasActiveInvestments, setHasActiveInvestments] = useState(true);
  const [investmentData, setInvestmentData] = useState(SAMPLE_INVESTMENT_DATA);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(SAMPLE_RECENT_ACTIVITY);
  const [isSampleData, setIsSampleData] = useState(true);

  // Function to determine if we should show the sample data notice
  const shouldShowSampleNotice = () => {
    // First check if we have any investments at all
    if (userInvestments.length === 0) {
      return true;
    }

    // Check if any investment is in 'active' status - the only state that should show real data
    const hasActiveInvestment = userInvestments.some(inv => inv.status === 'active');

    // If we have at least one active investment, don't show sample data
    return !hasActiveInvestment;
  };

  useEffect(() => {
    // Immediate user data fetch - no loading state needed for sample data
    const initializeDashboard = async () => {
      setShowOnboardingNotification(false);
      setShowPendingApprovalNotification(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // First check if user has active investments or pending applications
          const hasInvestments = await checkActiveInvestments(user.id);
          await fetchAllUserInvestments(user.id);

          // Then fetch investments if they exist
          const allCancelled = userInvestments.length > 0 &&
            userInvestments.every(inv =>
              ['cancelled', 'deleted'].includes(inv.status) ||
              (inv.application_status && ['deleted', 'cancelled', 'rejected'].includes(inv.application_status))
            );

          if (hasInvestments) {
            await fetchInvestments(user.id);
          } else if (userInvestments.length > 0 && !allCancelled) {
            // Use the most recent investment application to populate the dashboard
            const latestInvestment = userInvestments[0];
            setIsSampleData(false);

            // Calculate basic data from the latest investment
            const amount = latestInvestment.amount;
            const annualRate = latestInvestment.annual_percentage;
            const monthlyReturn = (amount * (annualRate / 100)) / 12;

            // Set investment data based on pending investment
            setInvestmentData({
              totalInvested: amount,
              currentValue: amount, // No returns yet since not active
              totalReturns: 0,
              monthlyReturn: monthlyReturn,
              annualizedReturn: annualRate,
              nextPaymentDate: 'Pending Activation',
              nextPaymentAmount: 0
            });

            // Show a single activity entry for the investment creation
            setRecentActivity([
              {
                id: latestInvestment.id,
                type: 'investment',
                description: 'Investment submitted',
                amount: amount,
                date: latestInvestment.created_at,
                status: 'completed'
              }
            ]);
          } else if (!hasInvestments || allCancelled) {
            // Reset to sample data if no active investments
            setIsSampleData(true);
            setInvestmentData(SAMPLE_INVESTMENT_DATA);
            setRecentActivity(SAMPLE_RECENT_ACTIVITY);
          }

          // Fetch documents and active application regardless
          await fetchDocuments();
          await fetchActiveApplication();
        } else {
          // Reset everything for unauthenticated users
          setHasActiveInvestments(false);
          setIsSampleData(true);
          setInvestmentData(SAMPLE_INVESTMENT_DATA);
          setRecentActivity(SAMPLE_RECENT_ACTIVITY);
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeDashboard();

    // Check for unread messages that might be notifications
    const checkForNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Check if there's an investment approval message
          const approvalMessage = data?.find(msg =>
            msg.subject?.includes('Investment Approved')
          );

          if (approvalMessage) {
            setShowOnboardingNotification(true);
          }
        }
      } catch (error) {
        console.error('Error checking for notifications:', error);
      }
    };

    checkForNotifications();
  }, []);

  const checkActiveInvestments = async (userId: string) => {
    try {
      // Use the RPC function to check for active investments or pending applications
      let hasInvestments = await user_has_active_investments(userId);
      setHasActiveInvestments(hasInvestments);

      // If no active investments found through the RPC function, check if we have any
      // investment in a status that should show real data (like 'pending_approval' or any active status)
      if (!hasInvestments && userInvestments.length > 0) {
        // Check if we have any investment that is in a state where we should show real data
        const activeInvestment = userInvestments.find(inv =>
          ['active', 'pending_approval', 'pending_activation',
            'promissory_note_pending', 'bank_details_pending',
            'plaid_pending', 'funds_pending', 'investor_onboarding_complete'].includes(inv.status)
        );

        if (activeInvestment) {
          hasInvestments = true;
          setHasActiveInvestments(true);
          setInvestmentApproved(true);
          setShowPendingApprovalNotification(false);
        }
      }

      if (hasInvestments) {
        setInvestmentApproved(true);
        setShowPendingApprovalNotification(false);
        return true;
      } else {
        setIsSampleData(true);
        setShowPendingApprovalNotification(false);
        setShowOnboardingNotification(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking active investments:', error);
      return false;
    }
  };

  const fetchAllUserInvestments = async (userId: string) => {
    try {
      // Use the new simple workflow function (no user_id parameter needed - uses auth.uid())
      const { data, error } = await supabase.rpc('get_user_applications');

      if (error) {
        console.error('Error in get_user_applications:', error);
        throw error;
      }

      // Debug logging to help troubleshoot
      console.log('User applications from database:', data);
      console.log('User ID being queried:', userId);

      setUserInvestments(data || []);

      // If we have investments but none are active, we still want to show them in history
      if (data && data.length > 0) {
        console.log('Found investments, statuses:', data.map(inv => inv.status).join(', '));
        // Check if any are active
        const activeInvestments = data.filter(inv => inv.status === 'active');
        console.log('Active investments count:', activeInvestments.length);
        if (activeInvestments.length > 0) {
          setHasActiveInvestments(true);
        }
      } else {
        console.log('No investments found for user');
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error fetching all user investments:', error);
      return false;
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setSignedDocuments([]);
        return;
      }

      // Use get_latest_user_documents to only get the latest version of each document type
      const { data, error } = await supabase.rpc('get_latest_user_documents', {
        p_user_id: user.id
      });

      if (error) throw error;

      // Filter out documents that are not relevant (only keep subscription agreements and promissory notes)
      const relevantDocuments = (data || []).filter(doc =>
        doc.document_type === 'subscription_agreement' ||
        doc.document_type === 'promissory_note'
      );

      // Only show documents that are in a valid state (pending, investor_signed, signed)
      const validDocuments = relevantDocuments.filter(doc =>
        doc.status === 'pending' ||
        doc.status === 'investor_signed' ||
        doc.status === 'signed'
      );

      setSignedDocuments(validDocuments);
    } catch (error) {
      console.error('Error fetching signed documents:', error);
      setSignedDocuments([]);
    }
  };

  const fetchActiveApplication = async () => {
    try {
      console.log("Fetching active application...");

      // Important - Force a direct DB query to bypass any caching issues
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the latest application directly from the database
      const { data: application, error } = await supabase
        .from('investment_applications')
        .select('*')
        .eq('user_id', user.id)
        .not('status', 'in', '(active,rejected,cancelled)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching application:", error);
        return;
      }

      console.log("Latest application found:", application);

      setActiveApplication(application || null);
      setLatestApplication(application || null);

      // Don't show any notifications if we have an actively cancelled investment
      const hasActivelyCancelledInvestment = userInvestments.some(inv =>
        inv.status === 'cancelled' && inv.application_id === application?.id
      );

      // Handle various application statuses
      if (application) {
        console.log("Application status:", application.status);

        if (!hasActivelyCancelledInvestment) {
          // Show onboarding notification for these statuses
          if (application.status === 'promissory_note_pending' ||
            application.status === 'bank_details_pending' ||
            application.status === 'plaid_pending' ||
            application.status === 'funds_pending') {
            console.log("Showing onboarding notification");
            setShowOnboardingNotification(true);
          }

          // Check if application is in documents_signed status (pending admin approval)
          if (application.status === 'documents_signed' ||
            application.status === 'pending_approval') {
            console.log("Showing pending approval notification");
            setShowPendingApprovalNotification(true);
          }
        }
      }

      // If we have application data and no active investments, use it to populate the investment data
      if (application && !hasActiveInvestments) {
        setIsSampleData(false);

        // Calculate investment data based on application details
        const amount = application.investment_amount;
        const annualRate = application.annual_percentage;

        // Calculate monthly return
        const monthlyReturn = (amount * (annualRate / 100)) / 12;

        // Set investment data
        setInvestmentData({
          totalInvested: amount,
          currentValue: amount, // No returns yet since not active
          totalReturns: 0, // No returns yet
          monthlyReturn: monthlyReturn,
          annualizedReturn: annualRate,
          nextPaymentDate: 'Pending Approval', // Placeholder
          nextPaymentAmount: 0 // Placeholder
        });

        // Clear activity since investment is not active yet
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching active application:', error);
    }
  };

  const fetchInvestments = async (userId: string) => {
    try {
      setIsSampleData(true); // Default to sample data unless we find active investments

      // Check if we have any investments already loaded
      let primaryInvestment;

      if (userInvestments.length > 0) {
        // Find the most relevant investment to display
        // Priority: active > investor_onboarding_complete > plaid_pending > funds_pending > etc.
        const priorityOrder = [
          'active',
          'investor_onboarding_complete',
          'plaid_pending',
          'funds_pending',
          'bank_details_pending',
          'promissory_note_pending',
          'pending_approval',
          'pending'
        ];

        // Sort investments by priority and get the first one
        const sortedInvestments = [...userInvestments].sort((a, b) => {
          const priorityA = priorityOrder.indexOf(a.status);
          const priorityB = priorityOrder.indexOf(b.status);
          return (priorityA === -1 ? 999 : priorityA) - (priorityB === -1 ? 999 : priorityB);
        });

        primaryInvestment = sortedInvestments[0];
      }

      // If we couldn't find an investment in userInvestments, try direct query
      if (!primaryInvestment) {
        const { data: investments, error } = await supabase
          .from('investments')
          .select('*, investment_applications(id, status)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!investments || investments.length === 0) {
          setInvestmentData(SAMPLE_INVESTMENT_DATA);
          setRecentActivity(SAMPLE_RECENT_ACTIVITY);
          return false;
        }

        primaryInvestment = investments[0];
      }

      // Return false if no investments found
      if (primaryInvestment) {
        setIsSampleData(false);

        // Calculate investment data
        const amount = primaryInvestment.amount;
        const annualRate = primaryInvestment.annual_percentage;
        const today = new Date();

        // Calculate months since investment started if there's a start date and status is active
        let monthsSinceStart = 0;
        let startDate;

        if (primaryInvestment.start_date && primaryInvestment.status === 'active') {
          startDate = new Date(primaryInvestment.start_date);
          monthsSinceStart = (today.getFullYear() - startDate.getFullYear()) * 12 +
            (today.getMonth() - startDate.getMonth());
        } else {
          // For non-active investments, use current date for calculations
          startDate = today;
        }

        // Calculate monthly return
        const monthlyReturn = (amount * (annualRate / 100)) / 12;

        // Calculate total returns so far
        // Only calculate returns if the investment is active
        const totalReturns = primaryInvestment.status === 'active' ? monthlyReturn * monthsSinceStart : 0;

        // Calculate current value
        const currentValue = amount + totalReturns;

        // Determine next payment date
        let nextPaymentDate = new Date(startDate);
        let nextPaymentDateString = 'Pending Activation';

        if (primaryInvestment.status !== 'active') {
          // For non-active investments, show "Pending Activation" instead of a date
          nextPaymentDateString = 'Pending Activation';
        } else if (primaryInvestment.payment_frequency === 'monthly') {
          nextPaymentDate.setMonth(startDate.getMonth() + monthsSinceStart + 1);
          nextPaymentDateString = nextPaymentDate.toISOString().split('T')[0];
        } else if (primaryInvestment.payment_frequency === 'quarterly') {
          nextPaymentDate.setMonth(startDate.getMonth() + (Math.floor(monthsSinceStart / 3) + 1) * 3);
          nextPaymentDateString = nextPaymentDate.toISOString().split('T')[0];
        } else { // annual
          nextPaymentDate.setFullYear(startDate.getFullYear() + Math.floor(monthsSinceStart / 12) + 1);
          nextPaymentDateString = nextPaymentDate.toISOString().split('T')[0];
        }

        // Calculate next payment amount
        const nextPaymentAmount = primaryInvestment.payment_frequency === 'monthly'
          ? monthlyReturn
          : primaryInvestment.payment_frequency === 'quarterly'
            ? monthlyReturn * 3
            : monthlyReturn * 12;

        setInvestmentData({
          totalInvested: amount,
          currentValue: currentValue,
          totalReturns: totalReturns,
          monthlyReturn: monthlyReturn,
          annualizedReturn: annualRate,
          nextPaymentDate: nextPaymentDateString,
          nextPaymentAmount: nextPaymentAmount
        });

        // Generate activity based on investment
        const newActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'investment',
            description: primaryInvestment.status === 'active' ? 'Investment activated' : 'Investment processed',
            amount: amount,
            date: primaryInvestment.start_date,
            status: primaryInvestment.status === 'active' ? 'completed' : 'processing'
          }
        ];

        // Add payment activities if months since start > 0 and investment is active
        if (monthsSinceStart > 0 && primaryInvestment.status === 'active') {
          // Add a payment for each month/quarter/year that has passed
          const paymentFrequency = primaryInvestment.payment_frequency;
          const paymentInterval = paymentFrequency === 'monthly' ? 1 :
            paymentFrequency === 'quarterly' ? 3 : 12;

          for (let i = 1; i <= Math.floor(monthsSinceStart / paymentInterval); i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(startDate.getMonth() + (i * paymentInterval));

            newActivity.push({
              id: `payment-${i}`,
              type: 'payment',
              description: `${paymentFrequency.charAt(0).toUpperCase() + paymentFrequency.slice(1)} return payment`,
              amount: nextPaymentAmount,
              date: paymentDate.toISOString().split('T')[0],
              status: 'completed'
            });
          }
        }

        // Add upcoming payment
        // Only add upcoming payment for active investments
        if (primaryInvestment.status === 'active') {
          newActivity.push({
            id: 'next-payment',
            type: 'payment',
            description: 'Upcoming payment',
            amount: nextPaymentAmount,
            date: nextPaymentDateString,
            status: 'pending'
          });
        }

        setRecentActivity(newActivity);
        setIsSampleData(false);
      }

      return true;
    } catch (error) {
      console.error('Error fetching investments:', error);
      return false;
    }
  };

  const handleContinueOnboarding = () => {
    const markMessagesRead = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          if (error) throw error;

          fetchActiveApplication();
          checkActiveInvestments(user.id);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesRead();
    setShowOnboardingNotification(false);

    if (activeApplication?.id) {
      switch (activeApplication.status) {
        case 'promissory_note_sent':
          navigate(`/promissory-note-flow?applicationId=${activeApplication.id}&step=promissory_note`);
          break;
        case 'promissory_note_pending':
          navigate(`/promissory-note-flow?applicationId=${activeApplication.id}&step=promissory_note`);
          break;
        case 'bank_details_pending':
          navigate(`/promissory-note-flow?applicationId=${activeApplication.id}&step=wire_details`);
          break;
        case 'plaid_pending':
          navigate(`/promissory-note-flow?applicationId=${activeApplication.id}&step=bank_connection`);
          break;
        case 'funds_pending':
          navigate(`/promissory-note-flow?applicationId=${activeApplication.id}&step=funds_pending`);
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  // Function to get appropriate onboarding notification text
  const getOnboardingNotificationText = () => {
    switch (activeApplication?.status) {
      case 'promissory_note_sent':
      case 'promissory_note_sent':
      case 'promissory_note_pending':
        return 'Your promissory note has been created and sent by our team. Please review and sign your promissory note to continue the investment process. This is Step 2 of 4.';
      case 'bank_details_pending':
        return 'Your signed promissory note has been received. Please review and confirm wire transfer details to send your investment. This is Step 2 of 4 (continued).';
      case 'funds_pending':
        return 'Thank you for confirming the wire details. Please complete your wire transfer as soon as possible using the provided instructions. Our team will verify receipt of funds.';
      case 'plaid_pending':
        return 'We have verified your promissory note and receipt of funds! Please connect your bank account to complete the investment process. This is Step 3 of 4.';
      case 'investor_onboarding_complete':
        return 'Congratulations! You have completed all investor steps. Your investment is now pending final verification and activation by our team. You will receive a confirmation soon.';
      default: return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Pending Approval') return dateString;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'document_access':
        return <FileText className="w-4 h-4" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Render a loading state while initial data is being fetched
  if (initialLoading) {
    return (
      <div className="pt-20">
        <section className="py-16 md:py-24">
          <div className="section">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="pt-20">
      <section className="py-16 md:py-24">
        <div className="section">
          <div className="max-w-7xl mx-auto">
            {/* Sample Data Notice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`bg-gold/10 border border-gold/20 p-6 rounded-lg mb-8 ${shouldShowSampleNotice() ? '' : 'hidden'}`}
            >
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-gold flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gold mb-2">Sample Investment Dashboard</h3>
                  <p className="text-text-secondary">
                    This dashboard displays sample data to demonstrate our investment tracking capabilities.
                    Upon making your investment with Inner Circle Lending, you'll receive access to a personalized
                    dashboard with your actual investment data, payment history, and real-time performance tracking.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Application Under Review Notification */}
            {showPendingApprovalNotification && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-blue-500/20 border-2 border-blue-500 p-6 rounded-lg mb-8"
              >
                <div className="flex items-start gap-4">
                  <Clock className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-blue-400 mb-2">Application Under Review</h3>
                    <p className="text-text-primary mb-4">
                      {activeApplication?.status === 'documents_signed' && (
                        <>Thank you for submitting your subscription agreement. Your application is currently under review by our team.
                          Once approved, you'll be notified to complete the remaining steps:</>
                      )}
                      {activeApplication?.status === 'promissory_note_pending' && (
                        <>Your investment application has been approved! Please sign the promissory note to continue the investment process.</>
                      )}
                      {activeApplication?.status === 'bank_details_pending' && (
                        <>Your promissory note has been signed. Please review the wire transfer details and complete your investment.</>
                      )}
                      {activeApplication?.status === 'funds_pending' && (
                        <>Wire transfer details have been verified. Please complete the wire transfer as instructed.</>
                      )}
                      {activeApplication?.status === 'plaid_pending' && (
                        <>We have received your funds. Please connect your bank account to complete the investment process.</>
                      )}
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-text-secondary mb-4">
                      <li>Signing your promissory note</li>
                      <li>Setting up your payment details</li>
                    </ul>
                    <p className="text-text-secondary">
                      This process typically takes 2-3 business days. You'll receive a notification when your application has been approved.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next Step Notification - After admin signs document */}
            {showOnboardingNotification && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gold/20 border-2 border-gold p-6 rounded-lg mb-8"
              >
                <div className="flex items-start gap-4">
                  <FileSignature className="w-8 h-8 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gold mb-2">Action Required: Continue Your Investment</h3>
                    <p className="text-text-primary mb-4">{getOnboardingNotificationText()}</p>
                    <button
                      onClick={handleContinueOnboarding}
                      className="button bg-gold text-background border-gold hover:bg-gold/90 hover:text-background"
                    >
                      {activeApplication?.status === 'promissory_note_pending' && 'Sign Promissory Note'}
                      {activeApplication?.status === 'promissory_note_sent' && 'Sign Promissory Note'}
                      {activeApplication?.status === 'bank_details_pending' && 'Continue to Wire Transfer Details'}
                      {activeApplication?.status === 'funds_pending' && 'View Wire Transfer Instructions'}
                      {activeApplication?.status === 'plaid_pending' && 'Continue to Connect Bank Account'}
                      {activeApplication?.status === 'investor_onboarding_complete' && 'View Investment Status'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* No Active Investment Notification - Shown when user has no investments and no pending applications */}
            {!hasActiveInvestments && !showPendingApprovalNotification && !showOnboardingNotification &&
              !userInvestments.some(inv => ['pending', 'pending_approval', 'documents_signed'].includes(inv.status)) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-surface border border-graphite p-6 rounded-lg mb-8"
                >
                  <div className="flex items-start gap-4">
                    <Info className="w-8 h-8 text-gold flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-gold mb-2">No Active Investment</h3>
                      <p className="text-text-primary mb-4">
                        You currently don't have any active investments. Start your investment journey with Inner Circle Lending today.
                      </p>
                      <Link
                        to="/investor-info"
                        className="button"
                      >
                        Start New Investment
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

            <div className="mb-12">
              <h1 className="heading-xl mb-4">Investment Dashboard</h1>
              <p className="text-xl text-text-secondary">
                {shouldShowSampleNotice()
                  ? `Welcome back, ${user?.email || 'Investor'}`
                  : `Welcome back, ${user?.email || 'Investor'}`}
              </p>
            </div>

            {/* Investment Overview */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 ${shouldShowSampleNotice() ? 'opacity-60' : ''}`}>
              {userInvestments.length > 0 && userInvestments[0].status === 'active' && (
                <div className="col-span-full bg-green-50 border border-green-500 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">Your investment is now active and accruing returns. The dashboard now displays your actual investment data.</p>
                  </div>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-surface p-6 rounded-lg border border-graphite"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-wide text-text-secondary">Total Invested</h3>
                  <Wallet className="w-5 h-5 text-gold" />
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {shouldShowSampleNotice()
                    ? formatCurrency(0)
                    : formatCurrency(investmentData.totalInvested)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-surface p-6 rounded-lg border border-graphite"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-wide text-text-secondary">Current Value</h3>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {shouldShowSampleNotice()
                    ? formatCurrency(0)
                    : formatCurrency(investmentData.currentValue)}
                </p>
                {!shouldShowSampleNotice() && investmentData.totalReturns > 0 && (
                  <p className="text-sm text-green-500 mt-1">
                    +{formatCurrency(investmentData.totalReturns)} ({investmentData.annualizedReturn}%)
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-surface p-6 rounded-lg border border-graphite"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-wide text-text-secondary">Monthly Return</h3>
                  <DollarSign className="w-5 h-5 text-gold" />
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {shouldShowSampleNotice()
                    ? formatCurrency(0)
                    : formatCurrency(investmentData.monthlyReturn)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-surface p-6 rounded-lg border border-graphite"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-wide text-text-secondary">Next Payment</h3>
                  <Calendar className="w-5 h-5 text-gold" />
                </div>
                <p className="text-xl font-bold text-text-primary">
                  {shouldShowSampleNotice()
                    ? formatCurrency(0)
                    : formatCurrency(investmentData.nextPaymentAmount)}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {shouldShowSampleNotice()
                    ? 'N/A'
                    : formatDate(investmentData.nextPaymentDate)}
                </p>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className={`lg:col-span-3 space-y-8 ${shouldShowSampleNotice() ? 'opacity-60' : ''}`}>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="bg-surface p-8 rounded-lg border border-graphite"
                >
                  <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-surface rounded-lg">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{activity.description}</p>
                              <p className="text-sm text-text-secondary">{formatDate(activity.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {activity.amount && (
                              <span className="font-semibold text-text-primary">
                                {formatCurrency(activity.amount)}
                              </span>
                            )}
                            {getStatusIcon(activity.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="mb-2">No activity yet</p>
                      <p className="text-sm text-gray-400">
                        Your investment activity will appear here once your investment is active
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8 lg:col-span-3 lg:grid lg:grid-cols-3 lg:gap-8">
                {/* Investment Call-to-Action */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="bg-gold/10 border border-gold/20 p-6 rounded-lg"
                >
                  <h3 className="text-lg font-semibold text-gold mb-4">{shouldShowSampleNotice() ? 'Ready to Invest?' : 'Need Help?'}</h3>
                  <p className="text-text-secondary mb-6 text-sm">
                    Contact our team to discuss your investment opportunities and gain access to your personalized dashboard.
                  </p>
                  <Link to="/contact" className="button w-full">
                    Schedule Consultation
                  </Link>
                </motion.div>

                {/* Messages */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="bg-surface p-6 rounded-lg border border-graphite"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm uppercase tracking-wide text-text-secondary">Messages</h3>
                    <MessageSquare className="w-5 h-5 text-gold" />
                  </div>
                  <div className="space-y-3">
                    <Link
                      to="/contact"
                      className="block p-3 bg-accent rounded-lg hover:bg-gold/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gold" />
                        <span>Contact Support</span>
                      </div>
                    </Link>
                    <div className="p-3 bg-accent rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-gold" />
                        <span className="text-sm text-text-secondary">Message admin feature coming soon</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Signed Documents */}
                {signedDocuments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-surface p-6 rounded-lg border border-graphite"
                  >
                    <h3 className="text-lg font-semibold text-gold mb-4">Your Documents</h3>
                    <div className="space-y-3">
                      {signedDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-gold" />
                            <div>
                              <p className="font-medium text-text-primary">
                                {doc.document_type === 'subscription_agreement'
                                  ? 'Subscription Agreement'
                                  : doc.document_type === 'promissory_note'
                                    ? 'Promissory Note'
                                    : doc.document_type}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {doc.status === 'signed'
                                  ? 'Fully signed'
                                  : doc.status === 'investor_signed'
                                    ? 'Awaiting admin signature'
                                    : 'In progress'}
                              </p>
                            </div>
                          </div>

                          {doc.document_url && (
                            <a
                              href={doc.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:text-gold/80 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <SuccessModal
              isOpen={showSuccessModal}
              onClose={() => setShowSuccessModal(false)}
              title={hasActiveInvestments ? "Information Updated Successfully!" : "No Active Investment"}
              message={hasActiveInvestments
                ? "Your personal information has been saved and updated in your dashboard."
                : "Your investment has been deleted. Please start a new investment application if you wish to continue."}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;