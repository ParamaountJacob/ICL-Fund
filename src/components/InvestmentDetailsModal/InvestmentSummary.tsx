import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

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
}

interface InvestmentSummaryProps {
    investment: Investment;
}

export const InvestmentSummary: React.FC<InvestmentSummaryProps> = ({ investment }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'pending':
            case 'pending_approval':
            case 'promissory_note_pending':
            case 'bank_details_pending':
            case 'funds_pending':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'cancelled':
            case 'deleted':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Active';
            case 'pending': return 'Pending Document Signing';
            case 'pending_approval': return 'Pending Approval';
            case 'promissory_note_pending': return 'Awaiting Promissory Note';
            case 'bank_details_pending': return 'Bank Details Required';
            case 'funds_pending': return 'Funds Verification';
            case 'plaid_pending': return 'Bank Connection Pending';
            case 'investor_onboarding_complete': return 'Ready for Activation';
            case 'cancelled': return 'Cancelled';
            case 'deleted': return 'Deleted';
            default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-50';
            case 'pending':
            case 'pending_approval':
            case 'promissory_note_pending':
            case 'bank_details_pending':
            case 'funds_pending':
            case 'plaid_pending':
            case 'investor_onboarding_complete':
                return 'text-yellow-600 bg-yellow-50';
            case 'cancelled':
            case 'deleted':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Status Banner */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${getStatusColor(investment.status)}`}>
                <div className="flex items-center">
                    {getStatusIcon(investment.status)}
                    <span className="ml-2 font-medium">{getStatusText(investment.status)}</span>
                </div>
                <span className="text-sm font-medium">ID: {investment.id.slice(-8)}</span>
            </div>

            {/* Investment Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center p-4 bg-background rounded-lg border border-card-border">
                        <DollarSign className="w-6 h-6 text-gold mr-3" />
                        <div>
                            <p className="text-sm text-text-secondary">Investment Amount</p>
                            <p className="text-xl font-bold text-text-primary">{formatCurrency(investment.amount)}</p>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-background rounded-lg border border-card-border">
                        <FileText className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                            <p className="text-sm text-text-secondary">Annual Return</p>
                            <p className="text-xl font-bold text-text-primary">{investment.annual_percentage}%</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center p-4 bg-background rounded-lg border border-card-border">
                        <Calendar className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                            <p className="text-sm text-text-secondary">Start Date</p>
                            <p className="text-lg font-semibold text-text-primary">{formatDate(investment.start_date)}</p>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-background rounded-lg border border-card-border">
                        <Clock className="w-6 h-6 text-purple-600 mr-3" />
                        <div>
                            <p className="text-sm text-text-secondary">Payment Frequency</p>
                            <p className="text-lg font-semibold text-text-primary capitalize">{investment.payment_frequency}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Details */}
            {investment.term_months && (
                <div className="p-4 bg-background rounded-lg border border-card-border">
                    <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Term Length</span>
                        <span className="font-semibold text-text-primary">{investment.term_months} months</span>
                    </div>
                </div>
            )}

            <div className="p-4 bg-background rounded-lg border border-card-border">
                <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Created</span>
                    <span className="font-semibold text-text-primary">{formatDate(investment.created_at)}</span>
                </div>
            </div>
        </motion.div>
    );
};
