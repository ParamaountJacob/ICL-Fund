import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface Investment {
    id: string;
    status: string;
    amount: number;
}

interface ActionButtonsProps {
    investment: Investment;
    documentSignatures?: any[];
    loading: boolean;
    onAction: (action: string) => void;
    successStep?: number | null;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    investment,
    documentSignatures = [],
    loading,
    onAction,
    successStep
}) => {
    const getActionButtonText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Sign Subscription Agreement (Step 1 of 4)';
            case 'pending_approval':
                return 'Create Promissory Note (Step 2 of 4)';
            case 'promissory_note_pending':
                const promissoryNoteDoc = documentSignatures?.find(doc =>
                    doc.document_type === 'promissory_note' && doc.status === 'investor_signed'
                );
                return promissoryNoteDoc
                    ? 'Sign Promissory Note (Step 2 of 4)'
                    : 'Awaiting Investor Signature (Step 2 of 4)';
            case 'bank_details_pending':
                return 'Complete Step 2';
            case 'funds_pending':
                return 'Verify Funds Receipt (Step 3 of 4)';
            case 'plaid_pending':
                return 'Awaiting Bank Connection (Step 4 of 4)';
            case 'investor_onboarding_complete':
                return 'Verify Bank Connection & Activate (Step 4 of 4)';
            default:
                return 'Approve';
        }
    };

    const getStageNumber = (status: string) => {
        switch (status) {
            case 'pending': return '1/4';
            case 'pending_approval': return '2/4';
            case 'promissory_note_pending': return '2/4';
            case 'bank_details_pending': return '2/4';
            case 'funds_pending': return '3/4';
            case 'plaid_pending': return '4/4';
            case 'investor_onboarding_complete': return '4/4';
            default: return '';
        }
    };

    const canPerformAction = (status: string) => {
        const actionableStatuses = [
            'pending_approval',
            'promissory_note_pending',
            'bank_details_pending',
            'funds_pending',
            'investor_onboarding_complete'
        ];
        return actionableStatuses.includes(status);
    };

    const getActionType = (status: string) => {
        switch (status) {
            case 'pending_approval': return 'approve';
            case 'promissory_note_pending': return 'sign_promissory';
            case 'bank_details_pending': return 'bank_details';
            case 'funds_pending': return 'verify_funds';
            case 'investor_onboarding_complete': return 'activate';
            default: return 'approve';
        }
    };

    const isAwaitingInvestor = (status: string) => {
        return ['pending', 'plaid_pending'].includes(status);
    };

    if (investment.status === 'active') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200"
            >
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <span className="text-green-800 font-medium">Investment is Active</span>
            </motion.div>
        );
    }

    if (['cancelled', 'deleted'].includes(investment.status)) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200"
            >
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <span className="text-red-800 font-medium">
                    Investment {investment.status === 'cancelled' ? 'Cancelled' : 'Deleted'}
                </span>
            </motion.div>
        );
    }

    if (isAwaitingInvestor(investment.status)) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-200"
            >
                <Send className="w-6 h-6 text-blue-600 mr-3" />
                <div className="text-center">
                    <span className="text-blue-800 font-medium block">Awaiting Investor Action</span>
                    <span className="text-blue-600 text-sm">
                        {investment.status === 'pending'
                            ? 'Investor needs to sign subscription agreement'
                            : 'Investor needs to connect bank account'
                        }
                    </span>
                </div>
            </motion.div>
        );
    }

    if (!canPerformAction(investment.status)) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200"
            >
                <span className="text-gray-600">No actions available for current status</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Progress Indicator */}
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-card-border">
                <span className="text-text-secondary">Progress</span>
                <span className="font-semibold text-gold">{getStageNumber(investment.status)}</span>
            </div>

            {/* Action Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction(getActionType(investment.status))}
                disabled={loading}
                className={`w-full flex items-center justify-center p-4 rounded-lg font-medium transition-all duration-200 ${loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : successStep !== null
                            ? 'bg-green-600 text-white'
                            : 'bg-gold text-white hover:bg-gold/90'
                    }`}
            >
                {loading ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing...
                    </div>
                ) : successStep !== null ? (
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Action Completed
                    </div>
                ) : (
                    <div className="flex items-center">
                        {getActionButtonText(investment.status)}
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                )}
            </motion.button>

            {/* Additional Info */}
            {investment.status === 'promissory_note_pending' && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 text-sm">
                        Once the promissory note is signed by the investor, you can proceed to the next step.
                    </p>
                </div>
            )}
        </motion.div>
    );
};
