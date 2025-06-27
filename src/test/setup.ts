import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('../lib/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
        rpc: vi.fn(),
        functions: {
            invoke: vi.fn(),
        },
    },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: 'div',
        section: 'section',
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        p: 'p',
        button: 'button',
        form: 'form',
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }: any) => {
        return React.createElement('a', { href: to, ...props }, children);
    },
}));
