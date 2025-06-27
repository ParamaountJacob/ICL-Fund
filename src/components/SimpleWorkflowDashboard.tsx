import React, { useState, useEffect } from 'react';
import {
    getUserApplications,
    getAdminApplications,
    userSignSubscription,
    userSignPromissoryNote,
    userCompleteWireTransfer,
    userConnectPlaid,
    adminSignSubscription,
    adminCreatePromissoryNote,
    adminConfirmInvestment,
    adminCompleteSetup,
    getStepDisplayText,
    getStepActionText,
    isUserActionRequired,
    isAdminActionRequired,
    getProgressPercentage,
    type SimpleApplication,
    type AdminApplication,
    type WorkflowStep
} from '../lib/simple-workflow';
import { CheckCircle, Clock, FileText, CreditCard, Building } from 'lucide-react';

interface SimpleWorkflowDashboardProps {
    isAdmin?: boolean;
}

const SimpleWorkflowDashboard: React.FC<SimpleWorkflowDashboardProps> = ({ isAdmin = false }) => {
    const [applications, setApplications] = useState<SimpleApplication[] | AdminApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadApplications();
    }, [isAdmin]);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const data = isAdmin ? await getAdminApplications() : await getUserApplications();
            setApplications(data);
        } catch (error) {
            console.error('Error loading applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserAction = async (applicationId: string, step: WorkflowStep) => {
        try {
            let success = false;

            switch (step) {
                case 'subscription_pending':
                    success = await userSignSubscription(applicationId);
                    break;
                case 'promissory_pending':
                    success = await userSignPromissoryNote(applicationId);
                    break;
                case 'funds_pending':
                    success = await userCompleteWireTransfer(applicationId);
                    break;
                case 'plaid_pending':
                    success = await userConnectPlaid(applicationId);
                    break;
            }

            if (success) {
                await loadApplications(); // Refresh data
            }
        } catch (error) {
            console.error('Error performing user action:', error);
            alert('Error performing action. Please try again.');
        }
    };

    const handleAdminAction = async (applicationId: string, step: WorkflowStep) => {
        try {
            let success = false;

            switch (step) {
                case 'admin_review':
                    success = await adminSignSubscription(applicationId);
                    break;
                case 'promissory_pending':
                    success = await adminCreatePromissoryNote(applicationId);
                    break;
                case 'admin_confirm':
                    success = await adminConfirmInvestment(applicationId);
                    break;
                case 'admin_complete':
                    success = await adminCompleteSetup(applicationId);
                    break;
            }

            if (success) {
                await loadApplications(); // Refresh data
            }
        } catch (error) {
            console.error('Error performing admin action:', error);
            alert('Error performing action. Please try again.');
        }
    };

    const getStepIcon = (step: WorkflowStep) => {
        switch (step) {
            case 'subscription_pending':
            case 'admin_review':
                return <FileText className="w-5 h-5" />;
            case 'promissory_pending':
                return <FileText className="w-5 h-5" />;
            case 'funds_pending':
                return <CreditCard className="w-5 h-5" />;
            case 'admin_confirm':
                return <CheckCircle className="w-5 h-5" />;
            case 'plaid_pending':
            case 'admin_complete':
                return <Building className="w-5 h-5" />;
            case 'active':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            default:
                return <Clock className="w-5 h-5" />;
        }
    };

    const getStepColor = (step: WorkflowStep) => {
        switch (step) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'subscription_pending':
            case 'promissory_pending':
            case 'funds_pending':
            case 'plaid_pending':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'admin_review':
            case 'admin_confirm':
            case 'admin_complete':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {isAdmin ? 'All Applications' : 'Your Applications'}
                </h2>

                {applications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {isAdmin ? 'No applications found.' : 'You have no applications yet.'}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        {getStepIcon(app.current_step)}
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                ${app.investment_amount.toLocaleString()} Investment
                                            </h3>
                                            {isAdmin && 'user_email' in app && (
                                                <p className="text-sm text-gray-500">
                                                    {app.user_first_name} {app.user_last_name} ({app.user_email})
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStepColor(app.current_step)}`}>
                                        {getStepDisplayText(app.current_step)}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span>{getProgressPercentage(app.current_step)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${getProgressPercentage(app.current_step)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Step Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <CheckCircle className={`w-3 h-3 ${app.subscription_signed_by_user ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>User Signed</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <CheckCircle className={`w-3 h-3 ${app.subscription_signed_by_admin ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Admin Signed</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <CheckCircle className={`w-3 h-3 ${app.promissory_note_signed ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Note Signed</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <CheckCircle className={`w-3 h-3 ${app.funds_received ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Funds Received</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                {((isAdmin && isAdminActionRequired(app.current_step)) ||
                                    (!isAdmin && isUserActionRequired(app.current_step))) && (
                                        <button
                                            onClick={() => isAdmin
                                                ? handleAdminAction(app.id, app.current_step)
                                                : handleUserAction(app.id, app.current_step)
                                            }
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            {getStepActionText(app.current_step, isAdmin)}
                                        </button>
                                    )}

                                {app.current_step === 'active' && (
                                    <div className="text-center py-2 text-green-600 font-medium">
                                        ✅ Investment Active
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimpleWorkflowDashboard;
