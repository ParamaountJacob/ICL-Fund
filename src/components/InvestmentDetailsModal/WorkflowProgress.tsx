import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, FileSignature, ArrowRight } from 'lucide-react';

interface WorkflowStage {
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'pending' | 'skipped';
}

interface WorkflowProgressProps {
    currentStatus: string;
    documentSignatures?: any[];
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
    currentStatus,
    documentSignatures = []
}) => {
    const getWorkflowStages = (status: string): WorkflowStage[] => {
        const stages: WorkflowStage[] = [
            {
                id: 'subscription',
                title: 'Subscription Agreement',
                description: 'Sign the subscription agreement',
                status: 'pending'
            },
            {
                id: 'promissory',
                title: 'Promissory Note',
                description: 'Create and sign promissory note',
                status: 'pending'
            },
            {
                id: 'funding',
                title: 'Fund Transfer',
                description: 'Transfer funds and verify receipt',
                status: 'pending'
            },
            {
                id: 'activation',
                title: 'Investment Active',
                description: 'Investment is active and earning returns',
                status: 'pending'
            }
        ];

        // Update stage status based on current investment status
        switch (status) {
            case 'pending':
                stages[0].status = 'current';
                break;
            case 'pending_approval':
            case 'promissory_note_pending':
                stages[0].status = 'completed';
                stages[1].status = 'current';
                break;
            case 'bank_details_pending':
            case 'funds_pending':
            case 'plaid_pending':
                stages[0].status = 'completed';
                stages[1].status = 'completed';
                stages[2].status = 'current';
                break;
            case 'investor_onboarding_complete':
                stages[0].status = 'completed';
                stages[1].status = 'completed';
                stages[2].status = 'completed';
                stages[3].status = 'current';
                break;
            case 'active':
                stages.forEach(stage => stage.status = 'completed');
                break;
            case 'cancelled':
            case 'deleted':
                stages.forEach(stage => {
                    if (stage.status === 'pending') stage.status = 'skipped';
                });
                break;
        }

        return stages;
    };

    const getStageIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-6 h-6 text-green-600" />;
            case 'current':
                return <Clock className="w-6 h-6 text-blue-600" />;
            case 'skipped':
                return <XCircle className="w-6 h-6 text-red-600" />;
            default:
                return <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />;
        }
    };

    const getStageColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'border-green-600 bg-green-50';
            case 'current':
                return 'border-blue-600 bg-blue-50';
            case 'skipped':
                return 'border-red-600 bg-red-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    const stages = getWorkflowStages(currentStatus);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
        >
            <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <FileSignature className="w-5 h-5 mr-2 text-gold" />
                Investment Progress
            </h3>

            <div className="space-y-3">
                {stages.map((stage, index) => (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`flex items-center p-4 rounded-lg border-2 ${getStageColor(stage.status)}`}
                    >
                        <div className="flex items-center flex-1">
                            {getStageIcon(stage.status)}
                            <div className="ml-4">
                                <h4 className="font-medium text-text-primary">{stage.title}</h4>
                                <p className="text-sm text-text-secondary">{stage.description}</p>
                            </div>
                        </div>

                        {index < stages.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Document Status Summary */}
            {documentSignatures.length > 0 && (
                <div className="mt-6 p-4 bg-background rounded-lg border border-card-border">
                    <h4 className="font-medium text-text-primary mb-3">Document Status</h4>
                    <div className="space-y-2">
                        {documentSignatures.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between text-sm">
                                <span className="text-text-secondary">
                                    {doc.document_type === 'subscription_agreement'
                                        ? 'Subscription Agreement'
                                        : 'Promissory Note'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'signed'
                                        ? 'bg-green-100 text-green-800'
                                        : doc.status === 'investor_signed'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {doc.status === 'signed'
                                        ? 'Fully Signed'
                                        : doc.status === 'investor_signed'
                                            ? 'Pending Admin'
                                            : 'Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
