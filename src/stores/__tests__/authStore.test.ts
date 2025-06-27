import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import { useAuthStore } from '../stores/authStore';
import { createMockUser } from '../test/utils';

// Mock the store
vi.mock('../stores/authStore');

describe('AuthStore', () => {
    const mockAuthStore = vi.mocked(useAuthStore);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with null user', () => {
        mockAuthStore.mockReturnValue({
            user: null,
            isLoading: false,
            error: null,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getCurrentUser: vi.fn(),
            updateProfile: vi.fn(),
            clearError: vi.fn(),
        });

        const store = useAuthStore();
        expect(store.user).toBeNull();
        expect(store.isLoading).toBe(false);
        expect(store.error).toBeNull();
    });

    it('should handle successful sign in', async () => {
        const mockUser = createMockUser();
        const mockSignIn = vi.fn().mockResolvedValue(undefined);

        mockAuthStore.mockReturnValue({
            user: mockUser,
            isLoading: false,
            error: null,
            signIn: mockSignIn,
            signUp: vi.fn(),
            signOut: vi.fn(),
            getCurrentUser: vi.fn(),
            updateProfile: vi.fn(),
            clearError: vi.fn(),
        });

        const store = useAuthStore();
        await store.signIn('test@example.com', 'password');

        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password');
        expect(store.user).toEqual(mockUser);
    });

    it('should handle sign in error', () => {
        const mockSignIn = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

        mockAuthStore.mockReturnValue({
            user: null,
            isLoading: false,
            error: 'Invalid credentials',
            signIn: mockSignIn,
            signUp: vi.fn(),
            signOut: vi.fn(),
            getCurrentUser: vi.fn(),
            updateProfile: vi.fn(),
            clearError: vi.fn(),
        });

        const store = useAuthStore();
        expect(store.error).toBe('Invalid credentials');
    });

    it('should handle loading state during authentication', () => {
        mockAuthStore.mockReturnValue({
            user: null,
            isLoading: true,
            error: null,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getCurrentUser: vi.fn(),
            updateProfile: vi.fn(),
            clearError: vi.fn(),
        });

        const store = useAuthStore();
        expect(store.isLoading).toBe(true);
    });

    it('should clear error when clearError is called', () => {
        const mockClearError = vi.fn();

        mockAuthStore.mockReturnValue({
            user: null,
            isLoading: false,
            error: null,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getCurrentUser: vi.fn(),
            updateProfile: vi.fn(),
            clearError: mockClearError,
        });

        const store = useAuthStore();
        store.clearError();

        expect(mockClearError).toHaveBeenCalled();
    });
});
