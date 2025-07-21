import { useState, useEffect } from 'react';
import { supabase } from '../../lib/client';
import { authService } from '../lib/auth';
import { investmentService } from '../lib/investments';
import { useAuthStore, useInvestmentStore, useNotificationStore } from '../../stores';

interface InvestmentData {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    monthlyReturn: number;
    annualizedReturn: number;
    nextPaymentDate: string | Date;
    nextPaymentAmount: number;
}

interface RecentActivity {
    id: string;
    type: 'payment' | 'document_access' | 'investment';
    description: string;
    amount?: number;
    date: string;
    status: 'completed' | 'pending' | 'processing';
}

interface SignedDocument {
    id: string;
    document_type: string;
    status: string;
    document_url?: string;
    created_at: string;
}

const SAMPLE_INVESTMENT_DATA: InvestmentData = {
    totalInvested: 0,
    currentValue: 0,
    totalReturns: 0,
    monthlyReturn: 0,
    annualizedReturn: 0,
    nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextPaymentAmount: 0
};

export const useDashboardData = () => {
    const [initialLoading, setInitialLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [activeApplication, setActiveApplication] = useState<any>(null);
    const [userInvestments, setUserInvestments] = useState<any[]>([]);
    const [hasActiveInvestments, setHasActiveInvestments] = useState(true);
    const [investmentData, setInvestmentData] = useState<InvestmentData>(SAMPLE_INVESTMENT_DATA);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isSampleData, setIsSampleData] = useState(true);
    const [showOnboardingNotification, setShowOnboardingNotification] = useState(false);
    const [showPendingApprovalNotification, setShowPendingApprovalNotification] = useState(false);
    const [investmentApproved, setInvestmentApproved] = useState(false);

    const fetchAllUserInvestments = async (userId: string) => {
        try {
            const investments = await investmentService.getUserInvestmentsWithApplications(userId);
            setUserInvestments(investments);
            return investments;
        } catch (error) {
            console.error('Error fetching user investments:', error);
            return [];
        }
    };

    const checkActiveInvestments = async (userId: string) => {
        try {
            const investments = await fetchAllUserInvestments(userId);
            const hasActive = investments.some(inv => inv.status === 'active');
            setHasActiveInvestments(hasActive);
            return hasActive;
        } catch (error) {
            console.error('Error checking active investments:', error);
            return false;
        }
    };

    const fetchInvestments = async (userId: string) => {
        try {
            const investments = await investmentService.getUserInvestmentsWithApplications(userId);

            if (investments.length > 0) {
                const primaryInvestment = investments[0];
                const amount = primaryInvestment.amount;
                const annualRate = primaryInvestment.annual_percentage;
                const startDate = new Date(primaryInvestment.start_date);
                const currentDate = new Date();
                const monthsSinceStart = Math.max(0,
                    (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (currentDate.getMonth() - startDate.getMonth())
                );

                const monthlyReturn = (amount * (annualRate / 100)) / 12;
                const totalReturns = monthlyReturn * monthsSinceStart;
                const currentValue = amount + totalReturns;

                // Calculate next payment date
                const nextPaymentDate = new Date(startDate);
                let nextPaymentDateString = 'Pending Activation';

                if (primaryInvestment.status === 'active') {
                    if (primaryInvestment.payment_frequency === 'monthly') {
                        nextPaymentDate.setMonth(startDate.getMonth() + monthsSinceStart + 1);
                        nextPaymentDateString = nextPaymentDate.toISOString().split('T')[0];
                    } else if (primaryInvestment.payment_frequency === 'quarterly') {
                        nextPaymentDate.setMonth(startDate.getMonth() + (Math.floor(monthsSinceStart / 3) + 1) * 3);
                        nextPaymentDateString = nextPaymentDate.toISOString().split('T')[0];
                    } else {
                        nextPaymentDate.setFullYear(startDate.getFullYear() + Math.floor(monthsSinceStart / 12) + 1);
                        nextPaymentDateString = nextPaymentDate.toISOString().split('T')[0];
                    }
                }

                const nextPaymentAmount = primaryInvestment.payment_frequency === 'monthly'
                    ? monthlyReturn
                    : primaryInvestment.payment_frequency === 'quarterly'
                        ? monthlyReturn * 3
                        : monthlyReturn * 12;

                setInvestmentData({
                    totalInvested: amount,
                    currentValue: currentValue,
                    totalReturns: totalReturns,
                    monthlyReturn: monthlyReturn,
                    annualizedReturn: annualRate,
                    nextPaymentDate: nextPaymentDateString,
                    nextPaymentAmount: nextPaymentAmount
                });

                // Generate activity
                const newActivity: RecentActivity[] = [
                    {
                        id: '1',
                        type: 'investment',
                        description: primaryInvestment.status === 'active' ? 'Investment activated' : 'Investment processed',
                        amount: amount,
                        date: primaryInvestment.start_date,
                        status: primaryInvestment.status === 'active' ? 'completed' : 'processing'
                    }
                ];

                setRecentActivity(newActivity);
                setIsSampleData(false);
            }

            return true;
        } catch (error) {
            console.error('Error fetching investments:', error);
            return false;
        }
    };

    const fetchDocuments = async () => {
        setLoadingDocuments(true);
        try {
            // This would use the document service
            // For now, keeping the existing logic
            const { data, error } = await supabase
                .from('document_signatures')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSignedDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoadingDocuments(false);
        }
    };

    const fetchActiveApplication = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('investment_applications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            setActiveApplication(data?.[0] || null);
        } catch (error) {
            console.error('Error fetching active application:', error);
        }
    };

    const shouldShowSampleNotice = () => {
        if (userInvestments.length === 0) return true;
        const hasActiveInvestment = userInvestments.some(inv => inv.status === 'active');
        return !hasActiveInvestment;
    };

    const initializeDashboard = async () => {
        setShowOnboardingNotification(false);
        setShowPendingApprovalNotification(false);

        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            if (currentUser) {
                const hasInvestments = await checkActiveInvestments(currentUser.id);
                await fetchAllUserInvestments(currentUser.id);

                const allCancelled = userInvestments.length > 0 &&
                    userInvestments.every(inv =>
                        ['cancelled', 'deleted'].includes(inv.status) ||
                        (inv.application_status && ['deleted', 'cancelled', 'rejected'].includes(inv.application_status))
                    );

                if (hasInvestments) {
                    await fetchInvestments(currentUser.id);
                } else if (userInvestments.length > 0 && !allCancelled) {
                    // Handle pending investments
                    const latestInvestment = userInvestments[0];
                    setIsSampleData(false);

                    const amount = latestInvestment.amount;
                    const annualRate = latestInvestment.annual_percentage;
                    const monthlyReturn = (amount * (annualRate / 100)) / 12;

                    setInvestmentData({
                        totalInvested: amount,
                        currentValue: amount,
                        totalReturns: 0,
                        monthlyReturn: monthlyReturn,
                        annualizedReturn: annualRate,
                        nextPaymentDate: 'Pending Activation',
                        nextPaymentAmount: 0
                    });

                    setRecentActivity([
                        {
                            id: latestInvestment.id,
                            type: 'investment',
                            description: 'Investment submitted',
                            amount: amount,
                            date: latestInvestment.created_at,
                            status: 'completed'
                        }
                    ]);
                } else {
                    setIsSampleData(true);
                    setInvestmentData(SAMPLE_INVESTMENT_DATA);
                    setRecentActivity([]);
                }

                await fetchDocuments();
                await fetchActiveApplication();
            } else {
                setHasActiveInvestments(false);
                setIsSampleData(true);
                setInvestmentData(SAMPLE_INVESTMENT_DATA);
                setRecentActivity([]);
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        initializeDashboard();
    }, []);

    return {
        // State
        initialLoading,
        user,
        signedDocuments,
        loadingDocuments,
        activeApplication,
        userInvestments,
        hasActiveInvestments,
        investmentData,
        recentActivity,
        isSampleData,
        showOnboardingNotification,
        showPendingApprovalNotification,
        investmentApproved,

        // Computed
        shouldShowSampleNotice: shouldShowSampleNotice(),

        // Actions
        refetchData: initializeDashboard,
        setShowOnboardingNotification,
        setShowPendingApprovalNotification,
        setInvestmentApproved
    };
};
