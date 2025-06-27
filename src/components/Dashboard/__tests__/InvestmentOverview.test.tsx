import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import { InvestmentOverview } from '../InvestmentOverview';

const mockInvestmentData = {
    totalInvested: 50000,
    currentValue: 52000,
    totalReturns: 2000,
    monthlyReturn: 500,
    annualizedReturn: 12,
    nextPaymentDate: '2025-02-01',
    nextPaymentAmount: 500,
};

describe('InvestmentOverview', () => {
    it('renders investment overview cards', () => {
        render(
            <InvestmentOverview
                investmentData={mockInvestmentData}
                isSampleData={false}
            />
        );

        // Check for formatted currency values
        expect(screen.getByText('$50,000')).toBeInTheDocument();
        expect(screen.getByText('$52,000')).toBeInTheDocument();
        expect(screen.getByText('$2,000')).toBeInTheDocument();
        expect(screen.getByText('$500')).toBeInTheDocument();

        // Check for percentage
        expect(screen.getByText('12.0% Annual Rate')).toBeInTheDocument();

        // Check for labels
        expect(screen.getByText('Total Invested')).toBeInTheDocument();
        expect(screen.getByText('Current Value')).toBeInTheDocument();
        expect(screen.getByText('Total Returns')).toBeInTheDocument();
        expect(screen.getByText('Next Payment')).toBeInTheDocument();
    });

    it('shows sample data notice when isSampleData is true', () => {
        render(
            <InvestmentOverview
                investmentData={mockInvestmentData}
                isSampleData={true}
            />
        );

        expect(screen.getByText('Sample Data Displayed')).toBeInTheDocument();
        expect(screen.getByText('Start your investment journey to see real portfolio data here.')).toBeInTheDocument();
    });

    it('does not show sample data notice when isSampleData is false', () => {
        render(
            <InvestmentOverview
                investmentData={mockInvestmentData}
                isSampleData={false}
            />
        );

        expect(screen.queryByText('Sample Data Displayed')).not.toBeInTheDocument();
    });

    it('handles pending payment status', () => {
        const pendingData = {
            ...mockInvestmentData,
            nextPaymentAmount: 0,
            nextPaymentDate: 'Pending Activation',
        };

        render(
            <InvestmentOverview
                investmentData={pendingData}
                isSampleData={false}
            />
        );

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Pending Activation')).toBeInTheDocument();
    });

    it('formats dates correctly', () => {
        render(
            <InvestmentOverview
                investmentData={mockInvestmentData}
                isSampleData={false}
            />
        );

        expect(screen.getByText('Feb 1, 2025')).toBeInTheDocument();
    });
});
