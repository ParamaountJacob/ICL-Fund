import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <BrowserRouter>
            {children}
        </BrowserRouter>
    );
};

const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const createMockUser = (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user' as const,
    first_name: 'Test',
    last_name: 'User',
    profile_updated: true,
    ...overrides,
});

export const createMockInvestment = (overrides = {}) => ({
    id: 'test-investment-id',
    user_id: 'test-user-id',
    application_id: 'test-application-id',
    amount: 50000,
    annual_percentage: 12,
    payment_frequency: 'monthly',
    start_date: '2025-01-01',
    status: 'active',
    term_months: 12,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    total_expected_return: 56000,
    ...overrides,
});

export const createMockNotification = (overrides = {}) => ({
    id: 'test-notification-id',
    user_id: 'test-user-id',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info' as const,
    read: false,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
});
