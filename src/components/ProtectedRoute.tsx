import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(!user && !loading);

  // Update modal state when auth state changes
  React.useEffect(() => {
    if (!loading) {
      setShowAuthModal(!user);
    }
  }, [user, loading]);

  // Debug logging
  console.log('ProtectedRoute - User:', user, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-16 min-h-screen bg-background">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          onSignUpSuccess={() => {
            setShowAuthModal(false);
            // You can add redirect logic here if needed
          }}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4 text-text-primary">Authentication Required</h2>
            <p className="text-text-secondary mb-6">Please sign in to access this page.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="button"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;