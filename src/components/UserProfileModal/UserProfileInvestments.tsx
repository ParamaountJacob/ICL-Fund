import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, Clock, CheckCircle, XCircle, FileText, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import {
    createPromissoryNoteSignatureRecord,
    sendSystemNotificationToUser,
    updateInvestmentDetails,
    supabase,
    getAdminDocumentSignatures
} from '../../lib/supabase';
import { InvestmentDetailsModal } from '../InvestmentDetailsModal';
import AlertModal from '../AlertModal';

// Move formatCurrency function outside the component to ensure it's always defined
function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Added this missing function to format dates
function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

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

interface UserProfileInvestmentsProps {
    investments: Investment[];
    user?: any;
    onInvestmentUpdate?: () => void;
}

const UserProfileInvestments: React.FC<UserProfileInvestmentsProps> = ({
    investments,
    user,
    onInvestmentUpdate = () => { }
}) => {
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [expandedInvestmentId, setExpandedInvestmentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Investment>>({});
    const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
    const [documentSignatures, setDocumentSignatures] = useState<any[]>([]);
    const [userInvestments, setUserInvestments] = useState<any[]>([]);

    React.useEffect(() => {
        // If no investments are passed, try to fetch them directly using the user ID
        if (investments.length === 0) {
            // Use the user ID from the selectedInvestment or from another source like a URL parameter
            if (selectedInvestment?.user_id) {
                fetchUserInvestments(selectedInvestment.user_id);
            } else if (user?.id) {
                // Fall back to the user prop if available
                fetchUserInvestments(user.id);
            }
        }
    }, [investments, selectedInvestment, user]);

    const fetchUserInvestments = async (userId: string) => {
        try {
            // Use the new simple workflow function (no user_id parameter needed - uses auth.uid())
            const { data, error } = await supabase.rpc('get_user_applications');
            if (error) throw error;
            setUserInvestments(data || []);
        } catch (error) {
            console.error('Error fetching user investments:', error);
        }
    };

    // Use either passed investments or fetched investments
    const displayInvestments = investments.length > 0 ? investments : userInvestments;
    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            pending_approval: 'bg-yellow-100 text-yellow-800',
            pending_activation: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            promissory_note_pending: 'bg-yellow-100 text-yellow-800',
            bank_details_pending: 'bg-yellow-100 text-yellow-800',
            plaid_pending: 'bg-yellow-100 text-yellow-800',
            funds_pending: 'bg-yellow-100 text-yellow-800',
            investor_onboarding_complete: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800'
        };

        // Updated display text for each status - with clearer step indicators
        const statusDisplay = {
            pending: 'Step 1 of 4: Initial Approval',
            pending_approval: 'Step 1 of 4: Final Approval',
            pending_activation: 'Approval Complete',
            active: 'Active',
            promissory_note_pending: 'Step 1 of 4: Sign Promissory Note',
            bank_details_pending: 'Step 2 of 4: Wire Transfer',
            funds_pending: 'Step 3 of 4: Funds Pending',
            plaid_pending: 'Step 4 of 4: Bank Connection',
            investor_onboarding_complete: 'Investment Ready',
            completed: 'Completed',
            cancelled: 'Cancelled',
            deleted: 'Deleted'
        };

        return (
            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
                {statusDisplay[status as keyof typeof statusDisplay] || status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const toggleExpand = (id: string) => {
        // Instead of just toggling, always expand and show details
        if (expandedInvestmentId === id) {
            // If already expanded, handle as a click on View Full Details
            const investment = investments.find(inv => inv.id === id);
            if (investment) {
                handleViewDetails(investment);
            }
        } else {
            setExpandedInvestmentId(id);
        }
    };

    const handleDeleteInvestment = async (investment: Investment) => {
        if (!investment.id) return;

        // Format the amount safely with error checking
        let amountText;
        try {
            amountText = investment.amount ? formatCurrency(investment.amount) : 'Unknown amount';
        } catch (e) {
            console.error('Error formatting amount:', e);
            amountText = 'this investment';
        }

        if (window.confirm(`Are you sure you want to decline ${amountText}? This will mark the investment as cancelled and reset the user's dashboard to sample data. This action cannot be undone.`)) {
            setLoading(true);
            try {
                // Update investment status to cancelled instead of deleting
                await updateInvestmentStatus(investment.id, 'cancelled');

                // Also update the application status if it exists
                if (investment.application_id) {
                    try {
                        const { error: appError } = await supabase
                            .from('investment_applications')
                            .update({ status: 'deleted' })
                            .eq('id', investment.application_id);

                        if (appError) {
                            console.error('Error updating application status:', appError);
                        }
                    } catch (appUpdateError) {
                        console.error('Error updating application status:', appUpdateError);
                    }
                }

                setAlertInfo({
                    title: 'Investment Declined',
                    message: 'Investment has been declined and marked as cancelled. The dashboard will be reset to sample data. The user will be notified of this change.',
                    type: 'success'
                });
                setShowAlert(true);

                // Send notification to user
                if (investment.user_id) {
                    await sendSystemNotificationToUser(
                        investment.user_id,
                        'Investment Cancelled',
                        `Your investment of ${formatCurrency(investment.amount)} has been cancelled. Your dashboard has been reset. Please contact our team if you would like to start a new investment.`
                    );
                }

                // Refresh investments
                if (onInvestmentUpdate) {
                    onInvestmentUpdate();
                }
            } catch (error) {
                console.error('Error declining investment:', error);
                setAlertInfo({
                    title: 'Investment Cancelled',
                    message: 'Investment has been cancelled and the user\'s dashboard will be reset to sample data. The user has been notified.',
                    type: 'error'
                });
                setShowAlert(true);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAcceptInvestment = async (investment: Investment) => {
        if (!investment.id || !investment.user_id) return;

        // Determine the next status based on current status
        const newStatus = investment.status === 'pending' ? 'pending_approval' : 'active';
        const actionDescription = investment.status === 'pending'
            ? 'Step 1 approved - pending final approval'
            : 'Investment fully approved and activated';

        setLoading(true);
        try {
            // Update investment status to the next step
            await updateInvestmentStatus(investment.id, newStatus);

            // Also update the application status if it exists
            if (investment.application_id) {
                try {
                    const { error: appError } = await supabase
                        .from('investment_applications')
                        .update({ status: newStatus === 'active' ? 'active' : 'pending_approval' })
                        .eq('id', investment.application_id);

                    if (appError) throw appError;
                } catch (appError) {
                    console.error('Error updating application status:', appError);
                    // Continue with the process even if this fails
                }
            }

            // Create promissory note signature record if there's an application and this is the final approval
            if (investment.application_id && newStatus === 'active') {
                await createPromissoryNoteSignatureRecord(investment.application_id);
            }

            // Send notification to user
            await sendSystemNotificationToUser(
                investment.user_id,
                newStatus === 'active' ? 'Investment Fully Approved' : 'Investment Initial Approval',
                newStatus === 'active'
                    ? `Your investment of ${formatCurrency(investment.amount)} has been fully approved. Please check your dashboard for the promissory note that requires your signature.`
                    : `Your investment of ${formatCurrency(investment.amount)} has passed initial approval. It is now pending final review by our team.`
            );

            setAlertInfo({
                title: newStatus === 'active' ? 'Investment Fully Approved' : 'Investment Initial Approval',
                message: newStatus === 'active'
                    ? 'Investment has been fully approved and promissory note has been prepared for signing.'
                    : 'Investment has passed initial approval. It will now go through final review.',
                type: 'success'
            });
            setShowAlert(true);

            // Refresh investments
            if (onInvestmentUpdate) {
                onInvestmentUpdate();
            }
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

    const handleEditInvestment = (investment: Investment) => {
        setEditingInvestment(investment.id);
        setEditData({
            amount: investment.amount,
            annual_percentage: investment.annual_percentage,
            payment_frequency: investment.payment_frequency,
            term_months: investment.term_months || 24
        });
    };

    const handleCancelEdit = () => {
        setEditingInvestment(null);
        setEditData({});
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: name === 'term_months' ? parseInt(value) :
                name === 'annual_percentage' || name === 'amount' ? parseFloat(value) :
                    value
        }));
    };

    const handleSaveInvestmentDetails = async (investmentId: string) => {
        if (!editData.amount || !editData.annual_percentage) {
            setAlertInfo({
                title: 'Validation Error',
                message: 'Amount and annual percentage are required',
                type: 'error'
            });
            setShowAlert(true);
            return;
        }

        setLoading(true);
        try {
            await updateInvestmentDetails(
                investmentId,
                editData.amount!,
                editData.annual_percentage!,
                editData.payment_frequency as string,
                editData.term_months as number
            );

            setAlertInfo({
                title: 'Investment Updated',
                message: 'Investment details have been updated successfully.',
                type: 'success'
            });
            setShowAlert(true);

            // Reset editing state
            setEditingInvestment(null);
            setEditData({});

            // Refresh investments
            if (onInvestmentUpdate) {
                onInvestmentUpdate();
            }
        } catch (error) {
            console.error('Error updating investment details:', error);
            setAlertInfo({
                title: 'Update Failed',
                message: 'Failed to update investment details: ' + (error instanceof Error ? error.message : 'Unknown error'),
                type: 'error'
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (investment: Investment) => {
        // Fetch document signatures before showing the modal
        const fetchDocumentSignatures = async () => {
            try {
                if (investment.application_id) {
                    // Use RPC function to get only the latest document for each type
                    const { data: signatures, error } = await supabase.rpc('get_active_user_documents', {
                        p_user_id: investment.user_id
                    });

                    if (error) throw error;

                    setDocumentSignatures(signatures || []);
                }

                setSelectedInvestment(investment);
                setShowModal(true);
            } catch (error) {
                console.error('Error fetching document signatures:', error);
                // Still show the modal even if signature fetch fails
                setSelectedInvestment(investment);
                setShowModal(true);
            }
        };

        fetchDocumentSignatures();
    };

    return (
        <>
            <div className="space-y-6 w-full">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Investment History</h3>
                    {user?.id && investments.length === 0 && (
                        <button
                            onClick={() => fetchUserInvestments(user.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            Refresh Investments
                        </button>
                    )}
                </div>

                {displayInvestments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300 opacity-50" />
                        <p>No investments found for this user.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayInvestments.map((investment) => (
                            <div
                                key={investment.id}
                                onClick={() => handleViewDetails(investment)}
                                className="bg-white rounded-lg border border-gray-200 transition-shadow hover:shadow-md cursor-pointer p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            {formatCurrency(investment.amount)} Investment
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {investment.annual_percentage}% annual return • {investment.payment_frequency} payments
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(investment.status)}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteInvestment(investment);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                            title="Delete Investment"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedInvestmentId === investment.id && !editingInvestment && (
                                    <div className="px-4 pb-4 space-y-6 border-t border-gray-200">
                                        {editingInvestment === investment.id ? (
                                            // Edit Mode
                                            <div className="bg-white p-4 rounded-lg border space-y-4 mt-4">
                                                <h5 className="font-medium text-gray-900">Edit Investment Details</h5>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Investment Amount
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="amount"
                                                            value={editData.amount || ''}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            min="0"
                                                            step="1000"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Annual Percentage
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="annual_percentage"
                                                            value={editData.annual_percentage || ''}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            min="11"
                                                            max="15"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Payment Frequency
                                                        </label>
                                                        <select
                                                            name="payment_frequency"
                                                            value={editData.payment_frequency || ''}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="monthly">Monthly</option>
                                                            <option value="quarterly">Quarterly</option>
                                                            <option value="annual">Annual</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Term (Months)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="term_months"
                                                            value={editData.term_months || ''}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            min="1"
                                                            max="120"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveInvestmentDetails(investment.id)}
                                                        disabled={loading}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {loading ? 'Saving...' : 'Save Changes'}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // View Mode
                                            <div className="grid md:grid-cols-2 gap-4 text-sm pt-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        <span className="text-gray-600">Amount:</span>
                                                        <span className="font-medium text-gray-900">{formatCurrency(investment.amount)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-blue-600" />
                                                        <span className="text-gray-600">Annual Return:</span>
                                                        <span className="font-medium text-gray-900">{investment.annual_percentage}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-purple-600" />
                                                        <span className="text-gray-600">Payment Frequency:</span>
                                                        <span className="font-medium text-gray-900 capitalize">{investment.payment_frequency}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-orange-600" />
                                                        <span className="text-gray-600">Start Date:</span>
                                                        <span className="font-medium">{formatDate(investment.start_date)}</span>
                                                    </div>
                                                    {investment.term_months && (
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-gray-600">Term:</span>
                                                            <span className="font-medium">{investment.term_months} months</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-600" />
                                                        <span className="text-gray-600">Created:</span>
                                                        <span className="font-medium">{formatDate(investment.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {editingInvestment !== investment.id && (
                                            <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                                                {(investment.status === 'pending' || investment.status === 'pending_approval') && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAcceptInvestment(investment);
                                                            }}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            {loading ? 'Processing...' : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteInvestment(investment);
                                                            }}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            {loading ? 'Processing...' : 'Decline'}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditInvestment(investment);
                                                    }}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                                >
                                                    Edit Details
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(investment);
                                                    }}
                                                    className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                                                >
                                                    View Full Details
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Investment Details Modal */}
            {selectedInvestment && (
                <InvestmentDetailsModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    investment={selectedInvestment}
                    documentSignatures={documentSignatures}
                    onInvestmentUpdate={(updatedInvestment) => {
                        // Update the selected investment in the list
                        setUserInvestments(prev =>
                            prev.map(inv => inv.id === updatedInvestment.id ? updatedInvestment : inv)
                        );

                        // If there's a parent update function, call it

                        // Update the local investment data
                        if (updatedInvestment) {
                            setSelectedInvestment(updatedInvestment);

                            // Also update the investment in the list
                            setUserInvestments(prev =>
                                prev.map(inv => inv.id === updatedInvestment.id ? updatedInvestment : inv)
                            );
                        }

                        if (onInvestmentUpdate) {
                            onInvestmentUpdate();
                        }
                    }}
                />
            )}

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

const updateInvestmentStatus = async (
    investmentId: string,
    newStatus: string
) => {
    const { error } = await supabase
        .from('investments')
        .update({
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', investmentId);

    if (error) throw error;

    // For promissory note stage
    if (newStatus === 'promissory_note_pending') {
        // Create or update document signature record for promissory note
        const { data: investment } = await supabase
            .from('investments')
            .select('application_id')
            .eq('id', investmentId)
            .single();

        if (investment?.application_id) {
            await createPromissoryNoteSignatureRecord(investment.application_id);
        }
    }
};

export default UserProfileInvestments;