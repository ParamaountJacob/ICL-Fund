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

// Simple workflow mock data factories
export const createMockSimpleApplication = (overrides = {}) => ({
    id: 'test-application-id',
    user_id: 'test-user-id',
    investment_amount: 250000,
    annual_percentage: 12,
    payment_frequency: 'monthly',
    term_months: 24,
    current_step: 'subscription_pending' as const,
    subscription_signed_by_user: null,
    subscription_signed_by_admin: null,
    promissory_note_created: null,
    promissory_note_signed: null,
    funds_received: null,
    admin_confirmed: null,
    plaid_connected: null,
    admin_completed: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
});

export const createMockSimpleInvestment = (overrides = {}) => ({
    id: 'test-investment-id',
    application_id: 'test-application-id',
    user_id: 'test-user-id',
    amount: 250000,
    annual_percentage: 12,
    payment_frequency: 'monthly',
    term_months: 24,
    status: 'promissory_pending' as const,
    activated_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
});

export const createMockSimpleNotification = (overrides = {}) => ({
    id: 'test-notification-id',
    application_id: 'test-application-id',
    recipient_id: 'test-user-id',
    sender_id: 'test-admin-id',
    title: 'Test Notification',
    message: 'This is a test notification',
    notification_type: 'user_action_needed' as const,
    current_step: 'subscription_pending' as const,
    is_read: false,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
});

export const createMockAdminAction = (overrides = {}) => ({
    id: 'test-admin-action-id',
    application_id: 'test-application-id',
    admin_user_id: 'test-admin-id',
    action_type: 'signed_subscription' as const,
    notes: 'Admin signed subscription agreement',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
});
