import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ForceProfileUpdateModal from './components/ForceProfileUpdateModal';
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
import { supabase, getUserProfile, debugDatabaseState, ensureUserProfileExists } from './lib/supabase';

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

function App() {
  useEffect(() => {
    document.title = 'Inner Circle Lending | Private Capital';
  }, []);

  const [user, setUser] = useState<any>(null);
  const [showForceProfileUpdate, setShowForceProfileUpdate] = useState(false);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');

  const checkUserProfile = async () => {
    console.log('=== CHECKING USER PROFILE START ===');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user from auth:', user);
    setUser(user);

    if (user) {
      console.log('Checking profile for user:', user.id);

      // Ensure the user profile exists in the database
      const profileExists = await ensureUserProfileExists();
      console.log('Profile exists check:', profileExists);

      // Run database diagnostic
      await debugDatabaseState();

      const profile = await getUserProfile();
      console.log('Profile data retrieved:', profile);
      console.log('Profile first_name:', profile?.first_name, '(type:', typeof profile?.first_name, ')');
      console.log('Profile last_name:', profile?.last_name, '(type:', typeof profile?.last_name, ')');

      // Check if first_name or last_name is missing
      const isFirstNameMissing = !profile?.first_name || profile?.first_name.trim() === '';
      const isLastNameMissing = !profile?.last_name || profile?.last_name.trim() === '';

      console.log('Is first name missing?', isFirstNameMissing);
      console.log('Is last name missing?', isLastNameMissing);

      if (isFirstNameMissing || isLastNameMissing) {
        console.log('Profile incomplete, showing modal. First name:', profile?.first_name, 'Last name:', profile?.last_name);
        setUserFirstName(profile?.first_name || '');
        setUserLastName(profile?.last_name || '');
        setShowForceProfileUpdate(true);
      } else {
        console.log('Profile complete!');
        setShowForceProfileUpdate(false);
      }
    }
    console.log('=== CHECKING USER PROFILE END ===');
  };

  useEffect(() => {
    checkUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        checkUserProfile();
      } else {
        setShowForceProfileUpdate(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-background text-text-primary">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/investor-info" element={<InvestorInfo />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/pitch-deck" element={<PitchDeck />} />
          <Route path="/ppm" element={<ProtectedRoute><PPM /></ProtectedRoute>} />
          <Route path="/ppm/edit" element={<ProtectedRoute><PPMEdit /></ProtectedRoute>} />
          <Route path="/ppm/view" element={<ProtectedRoute><PPMView /></ProtectedRoute>} />
          <Route path="/onboarding-flow/subscription-agreement" element={<ProtectedRoute><SubscriptionAgreement /></ProtectedRoute>} />
          <Route path="/onboarding-flow/promissory-note" element={<ProtectedRoute><PromissoryNote /></ProtectedRoute>} />
          <Route path="/onboarding-flow/wire-details" element={<ProtectedRoute><WireDetails /></ProtectedRoute>} />
          <Route path="/onboarding-flow/plaid-banking" element={<ProtectedRoute><PlaidBanking /></ProtectedRoute>} />
          <Route path="/promissory-note-flow" element={<ProtectedRoute><PromissoryNoteFlow /></ProtectedRoute>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        </Routes>
        <Footer />

        <ForceProfileUpdateModal
          isOpen={showForceProfileUpdate}
          onClose={() => {
            setShowForceProfileUpdate(false);
            // Re-check profile after modal closes to ensure it's complete
            checkUserProfile();
          }}
          firstName={userFirstName}
          lastName={userLastName}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;