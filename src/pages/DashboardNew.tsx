import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Eye, PieChart } from 'lucide-react';

import { supabase } from '../lib/client';
import { useDashboardData } from '../hooks/useDashboardData';
import { InvestmentOverview } from '../components/Dashboard/InvestmentOverview';
import { RecentActivityPanel } from '../components/Dashboard/RecentActivityPanel';
import { DocumentStatusPanel } from '../components/Dashboard/DocumentStatusPanel';
import { NotificationBanner } from '../components/Dashboard/NotificationBanner';
import { SuccessModal } from '../components/SuccessModal';

interface DocumentAccess {
    pitch_deck: boolean;
    ppm: boolean;
    wire_instructions: boolean;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        initialLoading,
        user,
        signedDocuments,
        loadingDocuments,
        hasActiveInvestments,
        investmentData,
        recentActivity,
        isSampleData,
        showOnboardingNotification,
        showPendingApprovalNotification,
        investmentApproved,
        shouldShowSampleNotice,
        setShowOnboardingNotification
    } = useDashboardData();

    const [showSuccessModal, setShowSuccessModal] = React.useState(false);
    const [documentAccess] = React.useState<DocumentAccess>({
        pitch_deck: true,
        ppm: true,
        wire_instructions: false
    });

    const handleContinueOnboarding = async () => {
        try {
            if (user) {
                const { error } = await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .eq('receiver_id', user.id)
                    .eq('is_read', false);

                if (error) throw error;
            }

            setShowOnboardingNotification(false);
            navigate('/onboarding');
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <section className="py-8 px-4 max-w-7xl mx-auto">
                <div className="space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold text-text-primary mb-4"
                        >
                            Investment Dashboard
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-text-secondary max-w-2xl mx-auto"
                        >
                            Track your investments, monitor returns, and manage your portfolio with Inner Circle Lending.
                        </motion.p>
                    </div>

                    {/* Notification Banners */}
                    <NotificationBanner
                        showOnboardingNotification={showOnboardingNotification}
                        showPendingApprovalNotification={showPendingApprovalNotification}
                        investmentApproved={investmentApproved}
                        hasActiveInvestments={hasActiveInvestments}
                        onContinueOnboarding={handleContinueOnboarding}
                    />

                    {/* Investment Overview Cards */}
                    <InvestmentOverview
                        investmentData={investmentData}
                        isSampleData={shouldShowSampleNotice}
                    />

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Activity */}
                        <RecentActivityPanel
                            recentActivity={recentActivity}
                            isSampleData={shouldShowSampleNotice}
                        />

                        {/* Document Status */}
                        <DocumentStatusPanel
                            signedDocuments={signedDocuments}
                            loadingDocuments={loadingDocuments}
                        />
                    </div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <Link
                            to="/pitch-deck"
                            className="bg-card border border-card-border rounded-lg p-6 hover:border-gold/50 transition-colors group"
                        >
                            <div className="flex items-center mb-4">
                                <Eye className="w-6 h-6 text-gold mr-3" />
                                <h3 className="font-semibold text-text-primary">View Pitch Deck</h3>
                            </div>
                            <p className="text-text-secondary text-sm">
                                Learn about our investment opportunities and strategy.
                            </p>
                        </Link>

                        <Link
                            to="/ppm"
                            className="bg-card border border-card-border rounded-lg p-6 hover:border-gold/50 transition-colors group"
                        >
                            <div className="flex items-center mb-4">
                                <Download className="w-6 h-6 text-gold mr-3" />
                                <h3 className="font-semibold text-text-primary">Download PPM</h3>
                            </div>
                            <p className="text-text-secondary text-sm">
                                Access the Private Placement Memorandum and investment details.
                            </p>
                        </Link>

                        <Link
                            to="/profile"
                            className="bg-card border border-card-border rounded-lg p-6 hover:border-gold/50 transition-colors group"
                        >
                            <div className="flex items-center mb-4">
                                <PieChart className="w-6 h-6 text-gold mr-3" />
                                <h3 className="font-semibold text-text-primary">Manage Profile</h3>
                            </div>
                            <p className="text-text-secondary text-sm">
                                Update your personal information and investment preferences.
                            </p>
                        </Link>
                    </motion.div>

                    {/* Success Modal */}
                    <SuccessModal
                        isOpen={showSuccessModal}
                        onClose={() => setShowSuccessModal(false)}
                        title={hasActiveInvestments ? "Information Updated Successfully!" : "No Active Investment"}
                        message={hasActiveInvestments
                            ? "Your personal information has been saved and updated in your dashboard."
                            : "Your investment has been deleted. Please start a new investment application if you wish to continue."}
                    />
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
