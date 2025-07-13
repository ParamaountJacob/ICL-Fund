import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Info, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NotificationBannerProps {
    showOnboardingNotification: boolean;
    showPendingApprovalNotification: boolean;
    investmentApproved: boolean;
    hasActiveInvestments: boolean;
    onContinueOnboarding: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
    showOnboardingNotification,
    showPendingApprovalNotification,
    investmentApproved,
    hasActiveInvestments,
    onContinueOnboarding
}) => {
    if (showOnboardingNotification) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Info className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                            <h4 className="text-blue-800 font-medium">Complete Your Investment Application</h4>
                            <p className="text-blue-600 text-sm">
                                You have unread messages. Continue where you left off to complete your investment.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onContinueOnboarding}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Continue
                    </button>
                </div>
            </motion.div>
        );
    }

    if (showPendingApprovalNotification) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
            >
                <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                        <h4 className="text-yellow-800 font-medium">Investment Under Review</h4>
                        <p className="text-yellow-600 text-sm">
                            Your investment application is being reviewed. You'll receive a notification once it's approved.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (investmentApproved) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                            <h4 className="text-green-800 font-medium">Investment Approved!</h4>
                            <p className="text-green-600 text-sm">
                                Congratulations! Your investment has been approved and is now active.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/onboarding"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        View Details
                    </Link>
                </div>
            </motion.div>
        );
    }

    if (!hasActiveInvestments) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-6 mb-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <MessageSquare className="w-6 h-6 text-gold mr-4" />
                        <div>
                            <h4 className="text-text-primary font-semibold text-lg">Ready to Start Investing?</h4>
                            <p className="text-text-secondary text-sm">
                                Join our exclusive lending opportunities and start earning consistent returns on your investments.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/contact"
                        className="bg-gold text-white px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors font-medium"
                    >
                        Start Investing
                    </Link>
                </div>
            </motion.div>
        );
    }

    return null;
};
