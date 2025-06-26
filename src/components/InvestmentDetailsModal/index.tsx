import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  FileText,
  CheckCircle,
  MailCheck,
} from 'lucide-react';
import {
  supabase,
  updateInvestmentStatus,
  adminSendPromissoryNote,
  activateInvestment,
} from '../lib/supabase';
import AlertModal from './AlertModal';
import { Investment } from '../types/investment';
import { DocumentSignature } from '../types/documentSignature';

export interface InvestmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onInvestmentUpdate?: (updatedInvestment: Investment) => void;
  documentSignatures?: DocumentSignature[];
}

export const InvestmentDetailsModal: React.FC<InvestmentDetailsModalProps> = ({
  isOpen,
  onClose,
  investment,
  onInvestmentUpdate = () => {},
  documentSignatures = [],
}) => {
  const [loading, setLoading] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);
  const [alertInfo, setAlertInfo] = React.useState({
    title: '',
    message: '',
    type: 'info' as const,
  });

  if (!isOpen || !investment) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      promissory_note_pending: 'bg-blue-100 text-blue-800',
      funds_pending: 'bg-yellow-100 text-yellow-800',
      investor_onboarding_complete: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusDisplay: { [key: string]: string } = {
      pending_approval: 'Pending Approval',
      active: 'Active',
      promissory_note_pending: 'Promissory Note Pending',
     promissory_note_sent: 'Promissory Note Sent',
      funds_pending: 'Funds Pending',
      investor_onboarding_complete: 'Ready for Activation',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
          colors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {statusDisplay[status] || status.replace(/_/g, ' ')}
      </span>
    );
  };

  const handleApproveInvestment = async () => {
    if (investment.status !== 'pending_approval') return;
    setLoading(true);
    try {
      await updateInvestmentStatus(investment.id, 'promissory_note_pending');
      const { data: updatedInvestment, error } = await supabase
        .from('investments')
        .select('*, investment_applications(*), user_profiles(*)')
        .eq('id', investment.id)
        .single();
      if (error) throw error;
      if (updatedInvestment) onInvestmentUpdate(updatedInvestment as any);
      setAlertInfo({
        title: 'Success',
        message: 'Investment approved and moved to promissory note stage.',
        type: 'success',
      });
      setShowAlert(true);
    } catch (error) {
      setAlertInfo({
        title: 'Error',
        message: `Failed to approve investment: ${
          error instanceof Error ? error.message : String(error)
        }`,
        type: 'error',
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPromissoryNote = async () => {
    if (!investment.application_id) return;
    setLoading(true);
    try {
      await adminSendPromissoryNote(investment.application_id);
      const { data: updatedInvestment, error } = await supabase
        .from('investments')
        .select('*, investment_applications(*), user_profiles(*)')
        .eq('id', investment.id)
        .single();
      if (error) throw error;
      if (updatedInvestment) onInvestmentUpdate(updatedInvestment as any);
      setAlertInfo({
        title: 'Success',
        message: 'Promissory note sent to investor.',
        type: 'success',
      });
      setShowAlert(true);
    } catch (error) {
      setAlertInfo({
        title: 'Error',
        message: `Failed to send promissory note: ${
          error instanceof Error ? error.message : String(error)
        }`,
        type: 'error',
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateInvestment = async () => {
    setLoading(true);
    try {
      await activateInvestment(investment.id);
      const { data: updatedInvestment, error } = await supabase
        .from('investments')
        .select('*, investment_applications(*), user_profiles(*)')
        .eq('id', investment.id)
        .single();
      if (error) throw error;
      if (updatedInvestment) onInvestmentUpdate(updatedInvestment as any);
      setAlertInfo({
        title: 'Investment Active',
        message: 'The investment has been successfully activated.',
        type: 'success',
      });
      setShowAlert(true);
    } catch (error) {
      setAlertInfo({
        title: 'Error',
        message: `Failed to activate investment: ${
          error instanceof Error ? error.message : String(error)
        }`,
        type: 'error',
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const getNextActionButton = () => {
    if (!investment) return null;

    if (investment.status === 'pending_approval') {
      return (
        <button
          onClick={handleApproveInvestment}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Approve Investment'}
        </button>
      );
    }
    if (investment.status === 'promissory_note_pending') {
      return (
        <button
          onClick={handleSendPromissoryNote}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Promissory Note'}
        </button>
      );
    }
    //
    // === THIS IS THE FIX ===
    // The entire 'else if' block that checked for 'bank_details_pending'
    // has been completely removed from existence. It's gone.
    // The backend change makes this code unreachable anyway, so we delete it.
    //
    if (investment.status === 'investor_onboarding_complete') {
        return (
            <button
                onClick={handleActivateInvestment}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm disabled:opacity-50"
            >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Activating...' : 'Activate Investment'}
            </button>
        );
    }
    return null;
  };
  
  const renderDocumentStatus = (doc: DocumentSignature) => {
    const status = doc?.status || 'pending';
    const statusColors: { [key: string]: string } = {
      pending: 'bg-gray-100 text-gray-800',
      sent: 'bg-yellow-100 text-yellow-800',
      investor_signed: 'bg-blue-100 text-blue-800',
      admin_signed: 'bg-purple-100 text-purple-800',
      signed: 'bg-green-100 text-green-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {doc.document_type.replace(/_/g, ' ')}: {status.replace(/_/g, ' ')}
      </span>
    );
  };
  
  const investorProfile = investment.user_profiles;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Investment Details
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm text-gray-600">Amount</div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(investment.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Annual Rate</div>
                      <div className="text-xl font-bold text-gray-900">
                        {investment.annual_percentage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Status</div>
                      <div>{getStatusBadge(investment.status)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Start Date</div>
                      <div className="text-gray-900">
                        {formatDate(investment.start_date)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        Investor Information
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Name</span>
                            <span className="text-gray-900">{investorProfile?.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Email</span>
                            <span className="text-gray-900">{investorProfile?.email}</span>
                        </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Documents
                    </h3>
                    <div className="space-y-3">
                      {documentSignatures && documentSignatures.length > 0 ? (
                        documentSignatures.map((doc) => (
                          <div key={doc.id} className="flex justify-between items-center">
                              {renderDocumentStatus(doc)}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No documents available</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MailCheck className="w-4 h-4 text-blue-600" />
                    Admin Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getNextActionButton()}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
      />
    </>
  );
};