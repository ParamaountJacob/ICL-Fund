import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { useInvestmentStore } from '../../stores';
import { InvestmentSummary } from './InvestmentSummary';
import { WorkflowProgress } from './WorkflowProgress';
import { ActionButtons } from './ActionButtons';
import AlertModal from '../AlertModal';

interface Investment {
    id: string;
    user_id: string;
    application_id?: string;
    amount: number;
    annual_percentage: number;
    payment_frequency: string;
    start_date: string;
    status: string;
    term_months?: number;
    created_at: string;
    investment_applications?: {
        id: string;
        status: string;
    };
}

interface InvestmentDetailsModalNewProps {
    isOpen: boolean;
    onClose: () => void;
    investment: Investment;
    documentSignatures?: any[];
    onInvestmentUpdate: (updatedInvestment: any) => void;
}

export const InvestmentDetailsModalNew: React.FC<InvestmentDetailsModalNewProps> = ({
    isOpen,
    onClose,
    investment,
    documentSignatures = [],
    onInvestmentUpdate
}) => {
    const { updateInvestmentStatus } = useInvestmentStore();
    const [currentInvestment, setCurrentInvestment] = useState(investment);
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertInfo, setAlertInfo] = useState({
        title: '',
        message: '',
        type: 'info' as const
    });
    const [successStep, setSuccessStep] = useState<number | null>(null);

    useEffect(() => {
        setCurrentInvestment(investment);
    }, [investment]);

    const showAlertMessage = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setAlertInfo({ title, message, type });
        setShowAlert(true);
    };

    const handleAction = async (actionType: string) => {
        setLoading(true);
        setSuccessStep(null);

        try {
            let newStatus: string;
            let successMessage: string;

            switch (actionType) {
                case 'approve':
                    newStatus = 'promissory_note_pending';
                    successMessage = 'Investment approved and moved to promissory note stage';
                    break;
                case 'sign_promissory':
                    newStatus = 'bank_details_pending';
                    successMessage = 'Promissory note signed, ready for bank details';
                    break;
                case 'bank_details':
                    newStatus = 'funds_pending';
                    successMessage = 'Bank details completed, awaiting funds';
                    break;
                case 'verify_funds':
                    newStatus = 'investor_onboarding_complete';
                    successMessage = 'Funds verified, ready for activation';
                    break;
                case 'activate':
                    newStatus = 'active';
                    successMessage = 'Investment activated successfully!';
                    break;
                default:
                    throw new Error('Unknown action type');
            }

            // Update via Zustand store
            await updateInvestmentStatus(currentInvestment.id, newStatus);

            // Update local state
            const updatedInvestment = { ...currentInvestment, status: newStatus };
            setCurrentInvestment(updatedInvestment);

            // Notify parent component
            onInvestmentUpdate(updatedInvestment);

            // Show success feedback
            setSuccessStep(1);
            setTimeout(() => setSuccessStep(null), 2000);

            showAlertMessage('Success', successMessage, 'success');

        } catch (error: any) {
            console.error('Error updating investment:', error);
            showAlertMessage(
                'Error',
                error.message || 'Failed to update investment status. Please try again.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-card-border">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">Investment Details</h2>
                            <p className="text-text-secondary">Investment ID: {currentInvestment.id}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-background rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-text-secondary" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-8">
                        {/* Investment Summary */}
                        <InvestmentSummary investment={currentInvestment} />

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Workflow Progress */}
                            <WorkflowProgress
                                currentStatus={currentInvestment.status}
                                documentSignatures={documentSignatures}
                            />

                            {/* Action Buttons */}
                            <div className="space-y-6">
                                <ActionButtons
                                    investment={currentInvestment}
                                    documentSignatures={documentSignatures}
                                    loading={loading}
                                    onAction={handleAction}
                                    successStep={successStep}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Alert Modal */}
                    <AlertModal
                        isOpen={showAlert}
                        onClose={() => setShowAlert(false)}
                        title={alertInfo.title}
                        message={alertInfo.message}
                        type={alertInfo.type}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InvestmentDetailsModalNew;
