import { create } from 'zustand';
import { investmentService, type Investment, type InvestmentWithApplication } from '../lib/investments';

interface InvestmentState {
    investments: InvestmentWithApplication[];
    currentInvestment: Investment | null;
    isLoading: boolean;
    error: string | null;

    // Computed values
    totalInvested: number;
    totalReturns: number;
    hasActiveInvestments: boolean;

    // Actions
    fetchUserInvestments: (userId: string) => Promise<void>;
    fetchAdminInvestments: () => Promise<void>;
    createInvestment: (data: any) => Promise<void>;
    updateInvestmentStatus: (id: string, status: any) => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

const calculateTotals = (investments: InvestmentWithApplication[]) => {
    const activeInvestments = investments.filter(inv => inv.status === 'active');

    const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalReturns = activeInvestments.reduce((sum, inv) => {
        // Calculate returns based on time elapsed and annual percentage
        const startDate = new Date(inv.start_date);
        const now = new Date();
        const monthsElapsed = Math.max(0,
            (now.getFullYear() - startDate.getFullYear()) * 12 +
            (now.getMonth() - startDate.getMonth())
        );

        const monthlyReturn = (inv.amount * (inv.annual_percentage / 100)) / 12;
        return sum + (monthlyReturn * monthsElapsed);
    }, 0);

    return { totalInvested, totalReturns };
};

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
    investments: [],
    currentInvestment: null,
    isLoading: false,
    error: null,
    totalInvested: 0,
    totalReturns: 0,
    hasActiveInvestments: false,

    fetchUserInvestments: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const investments = await investmentService.getUserInvestmentsWithApplications(userId);
            const { totalInvested, totalReturns } = calculateTotals(investments);
            const hasActiveInvestments = investments.some(inv => inv.status === 'active');

            set({
                investments,
                totalInvested,
                totalReturns,
                hasActiveInvestments,
                currentInvestment: investments[0] || null
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch investments' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchAdminInvestments: async () => {
        set({ isLoading: true, error: null });
        try {
            const investments = await investmentService.getAdminInvestmentsWithUsers();
            set({ investments });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch admin investments' });
        } finally {
            set({ isLoading: false });
        }
    },

    createInvestment: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
            const investment = await investmentService.createInvestment(data);
            const currentInvestments = get().investments;
            set({
                investments: [investment, ...currentInvestments],
                currentInvestment: investment
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to create investment' });
        } finally {
            set({ isLoading: false });
        }
    },

    updateInvestmentStatus: async (id: string, status: any) => {
        set({ isLoading: true, error: null });
        try {
            await investmentService.updateInvestmentStatus(id, status);

            const investments = get().investments.map(inv =>
                inv.id === id ? { ...inv, status } : inv
            );

            const { totalInvested, totalReturns } = calculateTotals(investments);
            const hasActiveInvestments = investments.some(inv => inv.status === 'active');

            set({
                investments,
                totalInvested,
                totalReturns,
                hasActiveInvestments
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to update investment' });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteInvestment: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await investmentService.deleteInvestment(id);

            const investments = get().investments.filter(inv => inv.id !== id);
            const { totalInvested, totalReturns } = calculateTotals(investments);
            const hasActiveInvestments = investments.some(inv => inv.status === 'active');

            set({
                investments,
                totalInvested,
                totalReturns,
                hasActiveInvestments,
                currentInvestment: investments[0] || null
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to delete investment' });
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null }),

    reset: () => set({
        investments: [],
        currentInvestment: null,
        totalInvested: 0,
        totalReturns: 0,
        hasActiveInvestments: false,
        error: null
    })
}));
