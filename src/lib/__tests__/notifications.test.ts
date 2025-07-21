import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../notifications';
import { supabase } from '../client';

// Mock the supabase client
vi.mock('../client');

describe('Notifications Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('subscribeToNotifications', () => {
        it('should create a channel subscription for user notifications', () => {
            const mockChannel = {
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn().mockReturnThis(),
            };

            const mockRemoveChannel = vi.fn();
            const mockSupabase = {
                channel: vi.fn().mockReturnValue(mockChannel),
                removeChannel: mockRemoveChannel,
            };

            vi.mocked(supabase).channel = mockSupabase.channel;
            vi.mocked(supabase).removeChannel = mockRemoveChannel;

            const userId = 'test-user-id';
            const callback = vi.fn();

            const result = notificationService.subscribeToNotifications(userId, callback);

            // Verify channel creation
            expect(mockSupabase.channel).toHaveBeenCalledWith('notifications');

            // Verify event subscription
            expect(mockChannel.on).toHaveBeenCalledWith(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                expect.any(Function)
            );

            // Verify subscription
            expect(mockChannel.subscribe).toHaveBeenCalled();

            // Verify return object structure
            expect(result).toHaveProperty('channel', mockChannel);
            expect(result).toHaveProperty('unsubscribe');
            expect(typeof result.unsubscribe).toBe('function');

            // Test unsubscribe functionality
            result.unsubscribe();
            expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
        });

        it('should handle subscription errors gracefully', () => {
            const mockChannel = {
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn().mockImplementation(() => {
                    throw new Error('Subscription failed');
                }),
            };

            const mockSupabase = {
                channel: vi.fn().mockReturnValue(mockChannel),
                removeChannel: vi.fn(),
            };

            vi.mocked(supabase).channel = mockSupabase.channel;
            vi.mocked(supabase).removeChannel = mockSupabase.removeChannel;

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const userId = 'test-user-id';
            const callback = vi.fn();

            expect(() => {
                notificationService.subscribeToNotifications(userId, callback);
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error subscribing to notifications:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('subscribeToAdminAlerts', () => {
        it('should create a channel subscription for admin alerts', () => {
            const mockChannel = {
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn().mockReturnThis(),
            };

            const mockRemoveChannel = vi.fn();
            const mockSupabase = {
                channel: vi.fn().mockReturnValue(mockChannel),
                removeChannel: mockRemoveChannel,
            };

            vi.mocked(supabase).channel = mockSupabase.channel;
            vi.mocked(supabase).removeChannel = mockRemoveChannel;

            const callback = vi.fn();

            const result = notificationService.subscribeToAdminAlerts(callback);

            // Verify channel creation
            expect(mockSupabase.channel).toHaveBeenCalledWith('admin-alerts');

            // Verify event subscription
            expect(mockChannel.on).toHaveBeenCalledWith(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'admin_alerts',
                },
                expect.any(Function)
            );

            // Verify subscription
            expect(mockChannel.subscribe).toHaveBeenCalled();

            // Verify return object structure
            expect(result).toHaveProperty('channel', mockChannel);
            expect(result).toHaveProperty('unsubscribe');
            expect(typeof result.unsubscribe).toBe('function');

            // Test unsubscribe functionality
            result.unsubscribe();
            expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
        });

        it('should handle admin alert subscription errors gracefully', () => {
            const mockChannel = {
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn().mockImplementation(() => {
                    throw new Error('Admin subscription failed');
                }),
            };

            const mockSupabase = {
                channel: vi.fn().mockReturnValue(mockChannel),
                removeChannel: vi.fn(),
            };

            vi.mocked(supabase).channel = mockSupabase.channel;
            vi.mocked(supabase).removeChannel = mockSupabase.removeChannel;

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const callback = vi.fn();

            expect(() => {
                notificationService.subscribeToAdminAlerts(callback);
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error subscribing to admin alerts:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('memory leak prevention', () => {
        it('should properly clean up subscriptions when unsubscribed', () => {
            const mockChannel = {
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn().mockReturnThis(),
            };

            const mockRemoveChannel = vi.fn();
            vi.mocked(supabase).channel = vi.fn().mockReturnValue(mockChannel);
            vi.mocked(supabase).removeChannel = mockRemoveChannel;

            const subscription1 = notificationService.subscribeToNotifications('user1', vi.fn());
            const subscription2 = notificationService.subscribeToAdminAlerts(vi.fn());

            // Both should have different channels
            expect(vi.mocked(supabase).channel).toHaveBeenCalledTimes(2);

            // Unsubscribe both
            subscription1.unsubscribe();
            subscription2.unsubscribe();

            // Both should be removed
            expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
            expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
        });
    });
});
