import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import { RecentActivityPanel } from '../RecentActivityPanel';

const mockRecentActivity = [
    {
        id: '1',
        type: 'investment' as const,
        description: 'Investment activated',
        amount: 50000,
        date: '2025-01-01T00:00:00Z',
        status: 'completed' as const,
    },
    {
        id: '2',
        type: 'payment' as const,
        description: 'Monthly return payment',
        amount: 500,
        date: '2025-01-15T00:00:00Z',
        status: 'completed' as const,
    },
    {
        id: '3',
        type: 'document_access' as const,
        description: 'PPM downloaded',
        date: '2024-12-28T00:00:00Z',
        status: 'completed' as const,
    },
];

describe('RecentActivityPanel', () => {
    it('renders activity list correctly', () => {
        render(
            <RecentActivityPanel
                recentActivity={mockRecentActivity}
                isSampleData={false}
            />
        );

        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('Investment activated')).toBeInTheDocument();
        expect(screen.getByText('Monthly return payment')).toBeInTheDocument();
        expect(screen.getByText('PPM downloaded')).toBeInTheDocument();
    });

    it('displays currency amounts correctly', () => {
        render(
            <RecentActivityPanel
                recentActivity={mockRecentActivity}
                isSampleData={false}
            />
        );

        expect(screen.getByText('$50,000')).toBeInTheDocument();
        expect(screen.getByText('$500')).toBeInTheDocument();
    });

    it('shows dates in correct format', () => {
        render(
            <RecentActivityPanel
                recentActivity={mockRecentActivity}
                isSampleData={false}
            />
        );

        expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
        expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
        expect(screen.getByText('Dec 28, 2024')).toBeInTheDocument();
    });

    it('displays status badges correctly', () => {
        const activityWithDifferentStatuses = [
            { ...mockRecentActivity[0], status: 'completed' as const },
            { ...mockRecentActivity[1], status: 'pending' as const },
            { ...mockRecentActivity[2], status: 'processing' as const },
        ];

        render(
            <RecentActivityPanel
                recentActivity={activityWithDifferentStatuses}
                isSampleData={false}
            />
        );

        expect(screen.getByText('completed')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('processing')).toBeInTheDocument();
    });

    it('shows empty state when no activity', () => {
        render(
            <RecentActivityPanel
                recentActivity={[]}
                isSampleData={false}
            />
        );

        expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });

    it('shows sample data message when isSampleData is true', () => {
        render(
            <RecentActivityPanel
                recentActivity={[]}
                isSampleData={true}
            />
        );

        expect(screen.getByText('Your investment activity will appear here')).toBeInTheDocument();
    });

    it('does not show amounts for activities without amount', () => {
        const activityWithoutAmount = [
            {
                id: '1',
                type: 'document_access' as const,
                description: 'PPM downloaded',
                date: '2024-12-28T00:00:00Z',
                status: 'completed' as const,
            },
        ];

        render(
            <RecentActivityPanel
                recentActivity={activityWithoutAmount}
                isSampleData={false}
            />
        );

        expect(screen.getByText('PPM downloaded')).toBeInTheDocument();
        expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
});
