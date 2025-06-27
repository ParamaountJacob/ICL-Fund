import React from 'react';
import { Outlet } from 'react-router-dom';
import { EnhancedAdminNavigation } from './EnhancedAdminNavigation';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

export const AdminLayout: React.FC = () => {
    const { userRole } = useAuth();

    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You need administrator privileges to access this area.
                    </p>
                    <a
                        href="/"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Return to Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <EnhancedAdminNavigation />
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
