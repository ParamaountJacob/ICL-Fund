import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthDebugger: React.FC = () => {
    const { user, profile, loading } = useAuth();

    return (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
            <h3 className="font-bold mb-2">Auth Debug</h3>
            <div>Loading: {loading ? 'true' : 'false'}</div>
            <div>User: {user ? user.email : 'null'}</div>
            <div>Profile: {profile ? 'exists' : 'null'}</div>
            {user && (
                <div className="mt-2">
                    <div>User ID: {user.id}</div>
                    <div>Created: {user.created_at}</div>
                </div>
            )}
        </div>
    );
};
