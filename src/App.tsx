import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ForceProfileUpdateModal from './components/ForceProfileUpdateModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoadingProvider } from './contexts/LoadingContext';
import Home from './pages/Home';
import About from './pages/About';
import InvestorInfo from './pages/InvestorInfo';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import PitchDeck from './pages/PitchDeck';
import PPM from './pages/PPM';
import PPMView from './pages/PPMView';
import Profile from './pages/Profile';
import PPMEdit from './pages/PPMEdit';
import PromissoryNoteFlow from './pages/PromissoryNoteFlow';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import SubscriptionAgreement from './pages/onboarding-flow/SubscriptionAgreement';
import PromissoryNote from './pages/onboarding-flow/PromissoryNote';
import WireDetails from './pages/onboarding-flow/WireDetails';
import PlaidBanking from './pages/onboarding-flow/PlaidBanking';
import { BusinessIntelligenceDashboard } from './components/BusinessIntelligenceDashboard';
import { UserJourneyAnalytics } from './components/UserJourneyAnalytics';
import { RealTimeMonitoringDashboard } from './components/RealTimeMonitoringDashboard';
import { AdminPerformanceDashboard } from './components/AdminPerformanceDashboard';
import { SystemHealthChecker } from './components/SystemHealthChecker';
import { AdminLayout } from './components/AdminLayout';
import { AuthDebugger } from './components/AuthDebugger';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force scroll to top on route change with multiple methods for reliability
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // Additional method for mobile browsers
      if (window.pageYOffset !== 0) {
        window.pageYOffset = 0;
      }
    };

    // Execute immediately
    scrollToTop();

    // Also execute after a small delay to ensure it works with dynamic content
    const timeoutId = setTimeout(scrollToTop, 10);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

// AppContent component that uses AuthContext
function AppContent() {
  // Simplified - no profile checking or force updates
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AuthDebugger />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/investor-info" element={<InvestorInfo />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pitch-deck" element={<ProtectedRoute><PitchDeck /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        {/* Disabled investment routes - backend stripped */}
        {/* <Route path="/ppm" element={<ProtectedRoute><PPM /></ProtectedRoute>} />
        <Route path="/ppm/edit" element={<ProtectedRoute><PPMEdit /></ProtectedRoute>} />
        <Route path="/ppm/view" element={<ProtectedRoute><PPMView /></ProtectedRoute>} />
        <Route path="/onboarding-flow/subscription-agreement" element={<ProtectedRoute><SubscriptionAgreement /></ProtectedRoute>} />
        <Route path="/onboarding-flow/promissory-note" element={<ProtectedRoute><PromissoryNote /></ProtectedRoute>} />
        <Route path="/onboarding-flow/wire-details" element={<ProtectedRoute><WireDetails /></ProtectedRoute>} />
        <Route path="/onboarding-flow/plaid-banking" element={<ProtectedRoute><PlaidBanking /></ProtectedRoute>} />
        <Route path="/promissory-note-flow" element={<ProtectedRoute><PromissoryNoteFlow /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
        {/* <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Admin />} />
          <Route path="business-intelligence" element={<BusinessIntelligenceDashboard />} />
          <Route path="user-journey" element={<UserJourneyAnalytics />} />
          <Route path="monitoring" element={<RealTimeMonitoringDashboard />} />
          <Route path="performance" element={<AdminPerformanceDashboard />} />
          <Route path="health" element={<SystemHealthChecker />} />
        </Route> */}
      </Routes>
      <Footer />

      {/* Disabled profile update modal */}
      {/* <ForceProfileUpdateModal
        isOpen={showForceProfileUpdate}
        onClose={() => {
          console.log('Modal closed - profile should be updated');
          setShowForceProfileUpdate(false);
        }}
        firstName={profile?.first_name || ''}
        lastName={profile?.last_name || ''}
      /> */}
    </div>
  );
}

function App() {
  useEffect(() => {
    document.title = 'Inner Circle Lending | Private Capital';
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <LoadingProvider>
          <NotificationProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </NotificationProvider>
        </LoadingProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;