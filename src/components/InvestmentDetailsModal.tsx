import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, DollarSign, Calendar, Clock, CheckCircle, XCircle, FileSignature, ExternalLink, ArrowRight, ChevronRight, Send } from 'lucide-react';
import {
    updateInvestmentStatus,
    move_investment_to_bank_details_stage,
    createPromissoryNoteSignatureRecord,
    sendSystemNotificationToUser,
    moveInvestmentToPromissoryNoteStage,
    moveInvestmentToFundsPendingStage,
    confirmFundsReceivedAndActivate,
    supabase
} from '../lib/supabase';
import AlertModal from './AlertModal';
import { InvestmentStatus } from '../types';

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

interface InvestmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    investment: Investment;
    documentSignatures?: any[];
    onInvestmentUpdate: (updatedInvestment: any) => void;
}

export const InvestmentDetailsModal: React.FC<InvestmentDetailsModalProps> = ({
    isOpen,
    onClose,
    investment,
    documentSignatures = [],
    onInvestmentUpdate
}) => {
    const [currentInvestment, setCurrentInvestment] = useState(investment);
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
    // State for success feedback animations
    const [successStep, setSuccessStep] = useState<number | null>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getActionButtonText = (status: string) => {
        switch (status) {
            case 'pending': return 'Sign Subscription Agreement (Step 1 of 4)';
            case 'pending_approval': return 'Create Promissory Note (Step 2 of 4)';
            case 'promissory_note_pending':
                // Check if the promissory note is already signed by the investor
                const promissoryNoteDoc = documentSignatures?.find(doc =>
                    doc.document_type === 'promissory_note' && doc.status === 'investor_signed'
                );
                if (promissoryNoteDoc) {
                    return 'Sign Promissory Note (Step 2 of 4)';
                } else {
                    return 'Awaiting Investor Signature (Step 2 of 4)';
                }
            case 'bank_details_pending': return 'Complete Step 2';
            case 'funds_pending': return 'Verify Funds Receipt (Step 3 of 4)';
            case 'plaid_pending': return 'Awaiting Bank Connection (Step 4 of 4)';
            case 'investor_onboarding_complete': return 'Verify Bank Connection & Activate (Step 4 of 4)';
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
            case 'active': return 'Active';
            default: return '';
        }
    };

    const handleAcceptInvestment = async () => {
        console.log("handleAcceptInvestment called");
        if (!investment || !investment.id || !investment.user_id) {
            console.log("Investment data missing", investment);
            return;
        }

        setLoading(true);
        try {
            // Handle different actions based on current status
            switch (investment.status) {
                case 'pending':
                    // Step 1: Sign the subscription agreement
                    const subscriptionDoc = documentSignatures?.find(doc =>
                        doc.document_type === 'subscription_agreement' && doc.status === 'investor_signed'
                    );

                    if (subscriptionDoc) {
                        // Show animation for step 1
                        setSuccessStep(1);

                        // Process document signature
                        await handleSignDocument(subscriptionDoc.id, 'subscription_agreement', false);

                        // Reset animation after a delay
                        setTimeout(() => setSuccessStep(null), 2000);
                    } else {
                        throw new Error('Subscription agreement document not found or not signed by investor');
                    }
                    setAlertInfo({
                        title: 'Step 1 of 4 Complete: Subscription Agreement Signed',
                        message: 'You have signed the subscription agreement. Now you can create and send the promissory note in Step 2.',
                        type: 'success'
                    });
                    break;

                case 'pending_approval':
                    // Step 1 (continued): Send promissory note after subscription agreement is signed
                    // Show animation for step 2
                    setSuccessStep(2);

                    try {
                        await moveInvestmentToPromissoryNoteStage(investment.id);
                    } catch (error) {
                        console.error('Error moving to promissory note stage:', error);
                        throw error;
                    }

                    // Reset animation after delay
                    setTimeout(() => setSuccessStep(null), 2000);

                    setAlertInfo({
                        title: 'Step 2 of 4 Started: Promissory Note Created & Sent',
                        message: 'Promissory note has been created and sent to the investor. They will be notified to sign it and complete the wire transfer.',
                        type: 'success'
                    });
                    break;

                case 'promissory_note_pending':
                    // Step 2: Create and send promissory note to investor
                    // Check if the promissory note is already signed by investor
                    const promissoryNoteDoc = documentSignatures?.find(doc =>
                        doc.document_type === 'promissory_note' && doc.status === 'investor_signed'
                    );

                    if (promissoryNoteDoc) {
                        // If investor has signed, admin should sign it now
                        setSuccessStep(2);

                        try {
                            await handleSignDocument(promissoryNoteDoc.id, 'promissory_note', false);
                        } catch (error) {
                            console.error('Error signing promissory note:', error);
                            throw error;
                        }

                        // Reset animation after delay
                        setTimeout(() => setSuccessStep(null), 2000);

                        setAlertInfo({
                            title: 'Step 2 of 4 Complete: Promissory Note Signed',
                            message: 'You have signed the promissory note. The investor will be directed to complete the wire transfer.',
                            type: 'success'
                        });
                    } else {
                        // If investor hasn't signed yet, create or update the promissory note
                        setSuccessStep(2);

                        try {
                            await moveInvestmentToPromissoryNoteStage(investment.id);
                        } catch (error) {
                            console.error('Error moving to promissory note stage:', error);
                            throw error;
                        }

                        // Reset animation after delay
                        setTimeout(() => setSuccessStep(null), 2000);

                        setAlertInfo({
                            title: 'Step 2 of 4 Started: Promissory Note Created & Sent',
                            message: 'Promissory note has been created and sent to the investor. They will be notified to sign it.',
                            type: 'success'
                        });
                    }
                    break;

                case 'bank_details_pending':
                    // Step 2 (continued): After signing promissory note, verify wire details
                    // Show animation for step 2
                    setSuccessStep(2);

                    // Mark step 2 as complete
                    setAlertInfo({
                        title: 'Step 2 of 4 Complete',
                        message: 'You have completed step 2. Now wait for the investor to sign the promissory note and complete their wire transfer before proceeding to step 3.',
                        type: 'success'
                    });

                    // Reset animation after delay
                    setTimeout(() => setSuccessStep(null), 2000);
                    break;

                case 'funds_pending':
                    // Step 3: Verify that funds have been received
                    // Show animation for step 3
                    setSuccessStep(3);

                    try {
                        await confirmFundsReceivedAndProceedToPlaid(investment.id);
                    } catch (error) {
                        console.error('Error confirming funds receipt:', error);
                        throw error;
                    }

                    // Send notification to user
                    await sendSystemNotificationToUser(
                        investment.user_id,
                        'Funds Received',
                        'We have received your funds. Please proceed to connect your bank account for future transactions.'
                    );

                    // Reset animation after delay
                    setTimeout(() => setSuccessStep(null), 2000);

                    setAlertInfo({
                        title: 'Step 3 of 4 Complete: Signed Note & Funds Verified',
                        message: 'The signed promissory note and funds receipt have been verified. The investor has been notified to connect their bank account.',
                        type: 'success'
                    });
                    break;

                case 'plaid_pending':
                    // Step 4: Bank connection approved, awaiting final activation
                    // Show animation for step 4
                    setSuccessStep(4);

                    try {
                        await updateInvestmentStatus(investment.id, 'investor_onboarding_complete' as InvestmentStatus);
                    } catch (error) {
                        console.error('Error updating to investor_onboarding_complete status:', error);
                        throw error;
                    }

                    // Reset animation after delay
                    setTimeout(() => setSuccessStep(null), 2000);

                    setAlertInfo({
                        title: 'Bank Connection Status Updated',
                        message: 'The investor has completed their bank connection. The investment is now ready for your final verification and activation.',
                        type: 'success'
                    });
                    break;

                case 'investor_onboarding_complete':
                    // Step 4 (final): Activate the investment
                    // Show animation for step 4
                    setSuccessStep(4);

                    try {
                        await updateInvestmentStatus(investment.id, 'active');
                    } catch (error) {
                        console.error('Error activating investment:', error);
                        throw error;
                    }

                    // Reset animation after delay
                    setTimeout(() => setSuccessStep(null), 2000);

                    setAlertInfo({
                        title: 'Step 4 of 4 Complete: Investment Fully Activated',
                        message: 'The investment has been successfully activated and is now accruing returns. The investor dashboard will now show actual investment data instead of sample data.',
                        type: 'success'
                    });
                    break;

                default:
                    await updateInvestmentStatus(investment.id, 'active');
                    setAlertInfo({
                        title: 'Investment Updated',
                        message: 'Investment status has been updated successfully.',
                        type: 'success'
                    });
            }

            onInvestmentUpdate();
            setShowAlert(true);
        } catch (error) {
            console.error('Error approving investment:', error);
            setAlertInfo({
                title: 'Approval Failed',
                message: 'Failed to approve investment: ' + (error instanceof Error ? error.message : 'Unknown error'),
                type: 'error'
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDeclineInvestment = async () => {
        if (!investment.id || !investment.user_id) return;

        if (window.confirm(`Are you sure you want to decline this investment of ${formatCurrency(investment.amount)}? The investment will be marked as cancelled and the user's dashboard will reset to sample data.`)) {
            setLoading(true);
            try {
                await updateInvestmentStatus(investment.id, 'cancelled');

                if (investment.application_id) {
                    try {
                        const { error } = await supabase
                            .from('investment_applications')
                            .update({ status: 'deleted' })
                            .eq('id', investment.application_id);
                        if (error) throw error;
                    } catch (appError) {
                        console.error('Error updating application status:', appError);
                    }
                }

                await sendSystemNotificationToUser(
                    investment.user_id,
                    'Investment Declined',
                    `We regret to inform you that your investment of ${formatCurrency(investment.amount)} has been declined. Please contact our team if you would like to discuss starting a new investment.`
                );

                setAlertInfo({
                    title: 'Investment Declined',
                    message: 'Investment has been declined and marked as cancelled. The user\'s dashboard will be reset to sample data. The user has been notified.',
                    type: 'info'
                });
                setShowAlert(true);

                onInvestmentUpdate();
            } catch (error) {
                console.error('Error declining investment:', error);
                setAlertInfo({
                    title: 'Decline Failed',
                    message: 'Failed to decline investment: ' + (error instanceof Error ? error.message : 'Unknown error'),
                    type: 'error'
                });
                setShowAlert(true);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSignDocument = async (signatureId: string, documentType: string, showAlert = true) => {
        if (!currentInvestment.id || !currentInvestment.user_id) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('document_signatures')
                .update({ status: 'signed' })
                .eq('id', signatureId);
            if (error) throw error;
            let updated;
            if (documentType === 'subscription_agreement') {
                const { data, error: upErr } = await supabase
                    .from('investments')
                    .update({ status: 'promissory_note_pending', updated_at: new Date().toISOString() })
                    .eq('id', currentInvestment.id)
                    .select()
                    .single();
                if (upErr) throw upErr;
                updated = data;
            } else if (documentType === 'promissory_note') {
                const { data, error: upErr } = await supabase
                    .from('investments')
                    .update({ status: 'bank_details_pending', updated_at: new Date().toISOString() })
                    .eq('id', currentInvestment.id)
                    .select()
                    .single();
                if (upErr) throw upErr;
                updated = data;
            }
            if (updated) {
                setCurrentInvestment(updated);
                onInvestmentUpdate(updated);
            }
            if (showAlert) setShowAlert(true);
        } catch (error) {
            console.error('Error signing document:', error);
            setAlertInfo({
                title: 'Signing Failed',
                message: 'Failed to sign document: ' + (error instanceof Error ? error.message : 'Unknown error'),
                type: 'error'
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to confirm funds received and proceed to Plaid step
    const confirmFundsReceivedAndProceedToPlaid = async (investmentId: string) => {
        const { error } = await supabase
            .from('investments')
            .update({
                status: 'plaid_pending',
                updated_at: new Date().toISOString()
            })
            .eq('id', investmentId);

        if (error) {
            throw new Error(`Error updating investment status: ${error.message}`);
        }
    };

    const handleCreateAndSendPromissoryNote = async () => {
        setLoading(true);
        try {
            // First, create the promissory note signature record
            if (currentInvestment.application_id) {
                await createPromissoryNoteSignatureRecord(currentInvestment.application_id);
            }

            // Then, update the investment status to promissory_note_sent
            const { data, error } = await supabase
                .from('investments')
                .update({
                    status: 'promissory_note_sent',
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentInvestment.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Send notification to user
            await sendSystemNotificationToUser(
                currentInvestment.user_id,
                'Promissory Note Available - Action Required',
                'Your promissory note has been created and is ready for your signature. Please check your dashboard to sign your promissory note.'
            );

            if (data) {
                // Update local state
                setCurrentInvestment(data);
                // Notify parent component
                onInvestmentUpdate(data);
            }

            setAlertInfo({
                title: 'Promissory Note Sent',
                message: 'The promissory note has been created and sent to the user for signature.',
                type: 'success'
            });
            setShowAlert(true);
        } catch (error) {
            console.error('Error creating promissory note:', error);
            setAlertInfo({
                title: 'Error Creating Promissory Note',
                message: 'Failed to create and send promissory note: ' + (error instanceof Error ? error.message : 'Unknown error'),
                type: 'error'
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    console.log("Current investment status:", investment.status);

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Investment Details</h2>
                                    <p className="text-gray-600">{formatCurrency(investment.amount)} - {investment.annual_percentage}%</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-900 mb-3">Investment Details - Stage {getStageNumber(investment.status)}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Principal Amount:</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(investment.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Annual Rate:</span>
                                            <span className="font-medium text-gray-900">{investment.annual_percentage}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Schedule:</span>
                                            <span className="font-medium text-gray-900 capitalize">{investment.payment_frequency}</span>
                                        </div>
                                        {investment.term_months && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Term Length:</span>
                                                <span className="font-medium text-gray-900">{investment.term_months} months</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-900 mb-3">Status Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Current Status: {getStageNumber(investment.status)}</span>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${investment.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    investment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        investment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Start Date:</span>
                                            <span className="font-medium text-gray-900">{formatDate(investment.start_date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created:</span>
                                            <span className="font-medium text-gray-900">{formatDate(investment.created_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Application ID:</span>
                                            <span className="font-medium text-gray-900">{investment.application_id || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Investment Onboarding Steps</h3>
                                <div className="space-y-4">
                                    {/* Step 1: Subscription Agreement Signing */}
                                    <div className={`bg-gray-100 border rounded-lg p-4 transition-all duration-500 ${['pending', 'pending_approval'].includes(investment.status) ? 'border-gold' : 'border-gray-300'
                                        }`}>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${['pending', 'pending_approval'].includes(investment.status) ? 'bg-gold text-background' :
                                                        investment.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                                    }`}>
                                                    {investment.status === 'pending' || investment.status === 'pending_approval' ?
                                                        '1' : <CheckCircle className="w-4 h-4" />}
                                                </div>
                                                <h4 className="font-medium text-gray-900">Step 1: Sign Subscription Agreement</h4>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${investment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    investment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        investment.status === 'pending_approval' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {investment.status === 'pending' ? 'Action Required' :
                                                    investment.status === 'pending_approval' ? 'Processing' :
                                                        investment.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {investment.status === 'pending' ?
                                                'Review and sign the subscription agreement submitted by the investor.' :
                                                investment.status === 'pending_approval' ?
                                                    'Subscription agreement has been signed. You can now proceed to Step 2.' :
                                                    investment.status === 'cancelled' ?
                                                        'This investment has been cancelled.' :
                                                        'Complete: Subscription agreement has been signed.'}
                                        </p>
                                        {/* Show sign button if status is pending */}
                                        {investment.status === 'pending' && (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        const sigDoc = documentSignatures.find(doc =>
                                                            doc.document_type === 'subscription_agreement' && doc.status === 'investor_signed'
                                                        );
                                                        if (sigDoc) {
                                                            // Add success animation
                                                            setSuccessStep(1);
                                                            // Handle signing
                                                            handleSignDocument(sigDoc.id, 'subscription_agreement');
                                                            // Reset animation after delay
                                                            setTimeout(() => setSuccessStep(null), 2000);
                                                        }
                                                    }}
                                                    disabled={!documentSignatures || !documentSignatures.some(doc =>
                                                        doc.document_type === 'subscription_agreement' && doc.status === 'investor_signed'
                                                    )}
                                                    className={`px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm ${!documentSignatures || !documentSignatures.some(doc =>
                                                        doc.document_type === 'subscription_agreement' && doc.status === 'investor_signed'
                                                    ) ? 'opacity-50 cursor-not-allowed' : ''
                                                        }`}
                                                >
                                                    <FileSignature className="w-4 h-4" /> Sign Agreement
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Step 2: Promissory Note & Wire Transfer */}
                                    <div className={`bg-gray-100 border rounded-lg p-4 transition-all duration-500 ${successStep === 2 ? 'border-green-500 bg-green-50' :
                                            investment.status === 'bank_details_pending' ? 'border-green-500 bg-green-50' :
                                                ['pending_approval', 'promissory_note_pending'].includes(investment.status) ? 'border-gold' : 'border-gray-300'
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${investment.status === 'bank_details_pending' ? 'bg-green-500 text-white' :
                                                        ['pending_approval', 'promissory_note_pending'].includes(investment.status) ? 'bg-gold text-background' :
                                                            ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending'].includes(investment.status) ? 'bg-gray-300 text-gray-600' :
                                                                investment.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                                    }`}>
                                                    {investment.status === 'bank_details_pending' ? <CheckCircle className="w-4 h-4" /> :
                                                        ['pending_approval', 'promissory_note_pending'].includes(investment.status) ? '2' :
                                                            ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending'].includes(investment.status) ? '2' : <CheckCircle className="w-4 h-4" />}
                                                </div>
                                                <h4 className="font-medium text-gray-900">Step 2: Create & Send Promissory Note</h4>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${investment.status === 'bank_details_pending' ? 'bg-green-100 text-green-800' :
                                                    ['pending_approval', 'promissory_note_pending'].includes(investment.status) ? 'bg-yellow-100 text-yellow-800' :
                                                        ['pending'].includes(investment.status) ? 'bg-gray-100 text-gray-800' :
                                                            investment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {investment.status === 'bank_details_pending' ? 'Completed' :
                                                    ['pending_approval', 'promissory_note_pending'].includes(investment.status) ? 'Action Required' :
                                                        ['pending'].includes(investment.status) ? 'Pending' :
                                                            investment.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {investment.status === 'pending_approval' ?
                                                'Action needed: Create and send the promissory note for the investor to sign.' :
                                                investment.status === 'promissory_note_pending' ? (
                                                    documentSignatures?.find(doc =>
                                                        doc.document_type === 'promissory_note' && doc.status === 'investor_signed'
                                                    ) ?
                                                        'Action needed: The investor has signed the promissory note. Please review and sign it to complete this step.' :
                                                        'The promissory note has been sent to the investor. Waiting for the investor to sign it.'
                                                ) :
                                                    investment.status === 'bank_details_pending' ?
                                                        'Complete: Promissory note signed and wire transfer details verified.' :
                                                        ['pending', 'pending_approval'].includes(investment.status) ?
                                                            'This step will be available after the subscription agreement is signed.' :
                                                            investment.status === 'cancelled' ?
                                                                'This investment has been cancelled.' :
                                                                'Complete: Promissory note signed and wire transfer details verified.'}
                                        </p>
                                        {/* Show action buttons for different statuses */}
                                        {(currentInvestment.status === 'pending_approval' || currentInvestment.status === 'promissory_note_pending') && (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            // If investor has signed, admin should sign it
                                                            const promissoryNoteDoc = documentSignatures?.find(doc =>
                                                                doc.document_type === 'promissory_note' && doc.status === 'investor_signed'
                                                            );
                                                            if (promissoryNoteDoc) {
                                                                setSuccessStep(2);
                                                                await handleSignDocument(promissoryNoteDoc.id, 'promissory_note', false);
                                                                setAlertInfo({
                                                                    title: 'Step 2 of 4 Complete: Promissory Note Signed',
                                                                    message: 'You have signed the promissory note. The investor will be directed to complete the wire transfer.',
                                                                    type: 'success'
                                                                });
                                                            } else {
                                                                // If investor hasn't signed yet, create or update the promissory note
                                                                setSuccessStep(2);

                                                                // First create the promissory note
                                                                if (currentInvestment.application_id) {
                                                                    await createPromissoryNoteSignatureRecord(currentInvestment.application_id);
                                                                }

                                                                // Then update the investment status
                                                                const { data, error } = await supabase
                                                                    .from('investments')
                                                                    .update({
                                                                        status: 'bank_details_pending',
                                                                        updated_at: new Date().toISOString()
                                                                    })
                                                                    .eq('id', currentInvestment.id)
                                                                    .select()
                                                                    .single();

                                                                if (error) throw error;

                                                                // Update the application status if it exists
                                                                if (currentInvestment.application_id) {
                                                                    await supabase
                                                                        .from('investment_applications')
                                                                        .update({
                                                                            status: 'bank_details_pending',
                                                                            updated_at: new Date().toISOString()
                                                                        })
                                                                        .eq('id', currentInvestment.application_id);
                                                                }

                                                                setCurrentInvestment(data);
                                                                onInvestmentUpdate(data);

                                                                setAlertInfo({
                                                                    title: 'Step 2 of 4 Started: Promissory Note Created & Sent',
                                                                    message: 'Promissory note has been created and sent to the investor. They will be notified to sign it.',
                                                                    type: 'success'
                                                                });
                                                            }
                                                            setShowAlert(true);
                                                            setTimeout(() => setSuccessStep(null), 2000);
                                                        } catch (error) {
                                                            console.error('Error creating promissory note:', error);
                                                            setAlertInfo({
                                                                title: 'Error Creating Promissory Note',
                                                                message: 'Failed to create and send promissory note: ' + (error instanceof Error ? error.message : 'Unknown error'),
                                                                type: 'error'
                                                            });
                                                            setShowAlert(true);
                                                            setSuccessStep(null);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
                                                    disabled={currentInvestment.status !== 'promissory_note_pending'}
                                                >
                                                    <FileSignature className="w-4 h-4" />
                                                    {documentSignatures?.find(doc =>
                                                        doc.document_type === 'promissory_note' && doc.status === 'investor_signed'
                                                    ) ? 'Sign Promissory Note' : 'Create & Send Promissory Note'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Step 3: Funds Verification */}
                                    <div className={`bg-gray-100 border rounded-lg p-4 transition-all duration-500 ${successStep === 3 ? 'border-green-500 bg-green-50' :
                                            investment.status === 'funds_pending' ? 'border-gold' : 'border-gray-300'
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${investment.status === 'funds_pending' ? 'bg-gold text-background' :
                                                        ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending'].includes(investment.status) ? 'bg-gray-300 text-gray-600' :
                                                            investment.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                                    }`}>
                                                    {investment.status === 'funds_pending' ?
                                                        '3' : ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending'].includes(investment.status) ? '3' : <CheckCircle className="w-4 h-4" />}
                                                </div>
                                                <h4 className="font-medium text-gray-900">Step 3: Verify Signed Note & Funds Receipt</h4>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${investment.status === 'funds_pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending'].includes(investment.status) ? 'bg-gray-100 text-gray-800' :
                                                        investment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {investment.status === 'funds_pending' ? 'Action Required' :
                                                    ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending'].includes(investment.status) ? 'Pending' :
                                                        investment.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {investment.status === 'funds_pending' ?
                                                'Action needed: Verify that the investor has signed the promissory note and funds have been received via wire transfer.' :
                                                ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending'].includes(investment.status) ?
                                                    'This step will be available after the investor signs the promissory note and completes the wire transfer.' :
                                                    investment.status === 'cancelled' ?
                                                        'This investment has been cancelled.' :
                                                        'Complete: Funds receipt has been verified.'}
                                        </p>

                                        {/* Show verify funds button for funds_pending status */}
                                        {investment.status === 'funds_pending' && (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation(); // Prevent event bubbling
                                                        try {
                                                            // Add success animation
                                                            setSuccessStep(3);
                                                            // Process the action
                                                            await confirmFundsReceivedAndProceedToPlaid(investment.id);
                                                            // Send notification to user
                                                            await sendSystemNotificationToUser(
                                                                investment.user_id,
                                                                'Funds Received',
                                                                'We have received your funds. Please proceed to connect your bank account for future transactions.'
                                                            );
                                                            // Show feedback
                                                            setAlertInfo({
                                                                title: 'Step 3 of 4 Complete: Signed Note & Funds Verified',
                                                                message: 'The signed promissory note and funds receipt have been verified. The investor has been notified to connect their bank account.',
                                                                type: 'success'
                                                            });
                                                            setShowAlert(true);
                                                            // Refresh data
                                                            onInvestmentUpdate();
                                                            // Reset animation after delay
                                                            setTimeout(() => setSuccessStep(null), 2000);
                                                        } catch (error) {
                                                            console.error('Error verifying funds receipt:', error);
                                                            setAlertInfo({
                                                                title: 'Error Verifying Funds',
                                                                message: 'Failed to verify funds receipt: ' + (error instanceof Error ? error.message : 'Unknown error'),
                                                                type: 'error'
                                                            });
                                                            setShowAlert(true);
                                                            setSuccessStep(null);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Verify Signed Note & Funds
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Step 4: Bank Connection & Activation */}
                                    <div className={`bg-gray-100 border rounded-lg p-4 transition-all duration-500 ${successStep === 4 ? 'border-green-500 bg-green-50' :
                                            investment.status === 'plaid_pending' || investment.status === 'investor_onboarding_complete' ? 'border-gold' : 'border-gray-300'
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${investment.status === 'plaid_pending' || investment.status === 'investor_onboarding_complete' ? 'bg-gold text-background' :
                                                        ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending', 'funds_pending'].includes(investment.status) ? 'bg-gray-300 text-gray-600' :
                                                            investment.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                                    }`}>
                                                    {investment.status === 'plaid_pending' || investment.status === 'investor_onboarding_complete' ?
                                                        '4' : ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending', 'funds_pending'].includes(investment.status) ? '4' : <CheckCircle className="w-4 h-4" />}
                                                </div>
                                                <h4 className="font-medium text-gray-900">Step 4: Verify Bank Connection & Activate</h4>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${investment.status === 'investor_onboarding_complete' ? 'bg-yellow-100 text-yellow-800' :
                                                    investment.status === 'plaid_pending' ? 'bg-blue-100 text-blue-800' :
                                                        ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending', 'funds_pending'].includes(investment.status) ? 'bg-gray-100 text-gray-800' :
                                                            investment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {investment.status === 'investor_onboarding_complete' ? 'Action Required' :
                                                    investment.status === 'plaid_pending' ? 'Awaiting Investor' :
                                                        ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending', 'funds_pending'].includes(investment.status) ? 'Pending' :
                                                            investment.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {investment.status === 'investor_onboarding_complete' ?
                                                'Action needed: Verify the bank connection is complete and activate the investment.' :
                                                investment.status === 'plaid_pending' ?
                                                    'Waiting: Investor needs to complete bank connection via Plaid.' :
                                                    ['pending', 'pending_approval', 'promissory_note_pending', 'bank_details_pending', 'funds_pending'].includes(investment.status) ?
                                                        'This step will be available after the signed note and funds receipt have been verified in Step 3.' :
                                                        investment.status === 'cancelled' ?
                                                            'This investment has been cancelled.' :
                                                            'Complete: Investment has been fully activated and is accruing returns.'}
                                        </p>

                                        {/* Show activate button for investor_onboarding_complete status */}
                                        {investment.status === 'investor_onboarding_complete' && (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation(); // Prevent event bubbling
                                                        try {
                                                            // Add success animation
                                                            setSuccessStep(4);
                                                            // Process the action
                                                            await updateInvestmentStatus(investment.id, 'active');
                                                            // Show feedback
                                                            setAlertInfo({
                                                                title: 'Step 4 of 4 Complete: Investment Fully Activated',
                                                                message: 'The investment has been successfully activated and is now accruing returns. The investor dashboard will now show actual investment data instead of sample data.',
                                                                type: 'success'
                                                            });
                                                            setShowAlert(true);
                                                            // Refresh data
                                                            onInvestmentUpdate();
                                                            // Reset animation after delay
                                                            setTimeout(() => setSuccessStep(null), 2000);
                                                        } catch (error) {
                                                            console.error('Error activating investment:', error);
                                                            setAlertInfo({
                                                                title: 'Error Activating Investment',
                                                                message: 'Failed to activate investment: ' + (error instanceof Error ? error.message : 'Unknown error'),
                                                                type: 'error'
                                                            });
                                                            setShowAlert(true);
                                                            setSuccessStep(null);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Verify & Activate Investment
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Decline button for pending investments */}
                            {['pending', 'pending_approval'].includes(investment.status) && (
                                <div className="border-t border-gray-200 pt-6 flex justify-end">
                                    <button
                                        onClick={handleDeclineInvestment}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        {loading ? 'Processing...' : 'Decline Investment'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
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