import { describe, it, expect, vi, beforeEach } from 'vitest';
import { investmentService } from '../investments';
import { supabase } from '../client';

// Mock the supabase client
vi.mock('../client');

describe('Investment Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserInvestmentsWithApplications', () => {
        it('should use secure RPC function and return data on success', async () => {
            const mockData = [
                {
                    id: 'investment-1',
                    user_id: 'user-1',
                    amount: 50000,
                    status: 'active',
                },
            ];

            const mockRpc = vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
            });

            vi.mocked(supabase).rpc = mockRpc;

            const result = await investmentService.getUserInvestmentsWithApplications('user-1');

            expect(mockRpc).toHaveBeenCalledWith('get_user_applications');
            expect(result).toEqual(mockData);
        });

        it('should throw error when RPC function fails (no unsafe fallback)', async () => {
            const mockError = { message: 'RPC function not found' };
            const mockRpc = vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
            });

            vi.mocked(supabase).rpc = mockRpc;

            await expect(
                investmentService.getUserInvestmentsWithApplications('user-1')
            ).rejects.toThrow('Failed to fetch user investments: RPC function not found');

            expect(mockRpc).toHaveBeenCalledWith('get_user_applications');
        });

        it('should not perform unsafe client-side queries when RPC fails', async () => {
            const mockRpc = vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'RPC failed' },
            });

            const mockFrom = vi.fn();
            vi.mocked(supabase).rpc = mockRpc;
            vi.mocked(supabase).from = mockFrom;

            await expect(
                investmentService.getUserInvestmentsWithApplications('user-1')
            ).rejects.toThrow();

            // Verify no fallback client queries were attempted
            expect(mockFrom).not.toHaveBeenCalled();
        });
    });

    describe('getAdminInvestmentsWithUsers', () => {
        it('should use secure RPC function for admin queries', async () => {
            const mockData = [
                {
                    id: 'investment-1',
                    user_id: 'user-1',
                    amount: 100000,
                    status: 'active',
                    user_email: 'user@example.com',
                },
            ];

            const mockRpc = vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
            });

            vi.mocked(supabase).rpc = mockRpc;

            const result = await investmentService.getAdminInvestmentsWithUsers();

            expect(mockRpc).toHaveBeenCalledWith('get_admin_investments_with_users');
            expect(result).toEqual(mockData);
        });

        it('should enforce RLS by throwing errors instead of unsafe fallbacks', async () => {
            const mockError = { message: 'Access denied' };
            const mockRpc = vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
            });

            const mockFrom = vi.fn();
            vi.mocked(supabase).rpc = mockRpc;
            vi.mocked(supabase).from = mockFrom;

            await expect(
                investmentService.getAdminInvestmentsWithUsers()
            ).rejects.toThrow('Failed to fetch admin investments: Access denied');

            // Critical: verify no unsafe fallback queries
            expect(mockFrom).not.toHaveBeenCalled();
        });
    });

    describe('createInvestment', () => {
        it('should create investment with proper error handling', async () => {
            const mockInvestmentData = {
                user_id: 'user-1',
                application_id: 'app-1',
                amount: 50000,
                annual_percentage: 12,
                payment_frequency: 'monthly',
                term_months: 12,
                start_date: '2025-01-01',
                status: 'active' as const,
                total_expected_return: 56000,
            };

            const expectedData = {
                ...mockInvestmentData,
                id: 'investment-1',
                created_at: expect.any(String),
                updated_at: expect.any(String),
            };

            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: expectedData,
                        error: null,
                    }),
                }),
            });

            const mockFrom = vi.fn().mockReturnValue({
                insert: mockInsert,
            });

            vi.mocked(supabase).from = mockFrom;

            const result = await investmentService.createInvestment(mockInvestmentData);

            expect(mockFrom).toHaveBeenCalledWith('investments');
            expect(result).toEqual(expectedData);
        });

        it('should properly throw errors instead of swallowing them', async () => {
            const mockError = { message: 'Insert failed' };

            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: mockError,
                    }),
                }),
            });

            const mockFrom = vi.fn().mockReturnValue({
                insert: mockInsert,
            });

            vi.mocked(supabase).from = mockFrom;

            const mockInvestmentData = {
                user_id: 'user-1',
                application_id: 'app-1',
                amount: 50000,
                annual_percentage: 12,
                payment_frequency: 'monthly',
                term_months: 12,
                start_date: '2025-01-01',
                status: 'active' as const,
                total_expected_return: 56000,
            };

            await expect(
                investmentService.createInvestment(mockInvestmentData)
            ).rejects.toThrow();
        });
    });

    describe('security compliance', () => {
        it('should never bypass RLS with direct table queries', async () => {
            // Test that all methods use proper RPC functions or proper inserts
            const mockRpc = vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'RPC failed' },
            });

            const mockFrom = vi.fn();
            vi.mocked(supabase).rpc = mockRpc;
            vi.mocked(supabase).from = mockFrom;

            // Try user investments
            await expect(
                investmentService.getUserInvestmentsWithApplications('user-1')
            ).rejects.toThrow();

            // Try admin investments  
            await expect(
                investmentService.getAdminInvestmentsWithUsers()
            ).rejects.toThrow();

            // Should use RPC functions, not direct table access for sensitive queries
            expect(mockRpc).toHaveBeenCalledTimes(2);
            expect(mockFrom).not.toHaveBeenCalled();
        });
    });
});
