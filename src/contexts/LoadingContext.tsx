// GLOBAL LOADING STATE - Fixes inconsistent loading states across components

import React, { createContext, useContext, useState } from 'react';

interface LoadingContextType {
    globalLoading: boolean;
    loadingStates: Record<string, boolean>;
    setGlobalLoading: (loading: boolean) => void;
    setLoading: (key: string, loading: boolean) => void;
    isLoading: (key: string) => boolean;
    isAnyLoading: () => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [globalLoading, setGlobalLoading] = useState(false);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    const setLoading = (key: string, loading: boolean) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: loading
        }));
    };

    const isLoading = (key: string) => {
        return loadingStates[key] || false;
    };

    const isAnyLoading = () => {
        return globalLoading || Object.values(loadingStates).some(Boolean);
    };

    const value: LoadingContextType = {
        globalLoading,
        loadingStates,
        setGlobalLoading,
        setLoading,
        isLoading,
        isAnyLoading
    };

    return (
        <LoadingContext.Provider value={value}>
            {children}
            {(globalLoading || isAnyLoading()) && <GlobalLoadingOverlay />}
        </LoadingContext.Provider>
    );
};

const GlobalLoadingOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mb-4"></div>
                <p className="text-gray-700 font-medium">Loading...</p>
            </div>
        </div>
    );
};

// Hook for async operations with loading state
export const useAsyncWithLoading = () => {
    const { setLoading } = useLoading();

    const executeWithLoading = async <T,>(
        key: string,
        asyncFn: () => Promise<T>
    ): Promise<T> => {
        try {
            setLoading(key, true);
            const result = await asyncFn();
            return result;
        } finally {
            setLoading(key, false);
        }
    };

    return { executeWithLoading };
};
