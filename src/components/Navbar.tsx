import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, FileText, Bell } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, authService } from '../lib';
import type { UserRole } from '../lib';
import AuthModal from './AuthModal';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Scroll listener for homepage header transparency
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    if (pathname === '/') {
      window.addEventListener('scroll', handleScroll);
    } else {
      // For other pages, we want the scrolled effect immediately
      setIsScrolled(true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    // Get current user and profile using the new auth service
    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const authUser = await authService.getCurrentUser();
        if (authUser) {
          setUserRole(authUser.role);

          // Get profile for name display
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, full_name')
            .eq('user_id', user.id)
            .maybeSingle();

          // Prioritize full_name over first_name + last_name
          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else if (profile?.first_name && profile?.last_name) {
            setUserName(`${profile.first_name} ${profile.last_name}`);
          }
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const authUser = await authService.getCurrentUser();
        if (authUser) {
          setUserRole(authUser.role);

          // Get profile for name display
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, full_name')
            .eq('user_id', session.user.id)
            .maybeSingle();

          // Prioritize full_name over first_name + last_name
          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else if (profile?.first_name && profile?.last_name) {
            setUserName(`${profile.first_name} ${profile.last_name}`);
          }
        }
      } else {
        setUserRole('user');
        setUserName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleNavigateToAdmin = () => {
    navigate('/admin');
  };
  // Determine if this is the home page
  const isHomePage = pathname === '/';

  // Header should be transparent on home page when not scrolled, match progress steps opacity elsewhere
  const headerClasses = isHomePage
    ? `fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300 ${isScrolled ? 'bg-background/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
    }`
    : 'fixed top-0 left-0 right-0 z-50 py-4 bg-background/95 backdrop-blur-sm shadow-md';

  return (
    <header
      className={headerClasses}
    >
      <div className="container px-4 md:px-6 mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-text-primary">
          <img
            src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
            alt="Inner Circle Lending"
            className="h-5 md:h-8 w-auto"
          />
          <span className="font-display font-semibold text-sm md:text-lg uppercase tracking-wide">InnerCircle</span>
        </Link>

        {/* --- Desktop Menu (Corrected) --- */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/faq" className="nav-link">FAQ</Link>
          <Link to="/investor-info" className="nav-link">Investor Info</Link>
          <Link to="/contact" className="nav-link">Contact</Link>

          {(userRole === 'admin' || userRole === 'sub_admin') && (
            <Link to="/admin" className="nav-link">Admin</Link>
          )}

          {user ? (
            <>
              <div className="relative group">
                <Link to="/profile" className="w-8 h-8 rounded-full bg-surface border border-graphite flex items-center justify-center hover:bg-accent transition-colors">
                  <User className="w-4 h-4 text-gold" />
                </Link>
                <div className="absolute right-0 mt-2 py-2 w-56 bg-surface border border-graphite rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {userName && (
                    <div className="px-4 py-2 border-b border-graphite">
                      <p className="text-sm text-gold font-medium">{userName}</p>
                      <p className="text-xs text-text-secondary">{user?.email}</p>
                    </div>
                  )}
                  <Link to="/dashboard" className="block w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-accent">Dashboard</Link>
                  <Link to="/profile" className="block w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-accent">View Profile</Link>
                  <hr className="my-1 border-graphite" />
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-accent"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
              <NotificationBell
                userRole={userRole}
                isMobile={false}
                onNavigateToAdmin={() => navigate('/admin')}
                onNavigateToDashboard={() => navigate('/dashboard')}
              />
            </>
          ) : (
            <button
              onClick={() => {
                const authModal = document.createElement('div');
                authModal.id = 'auth-modal-container';
                document.body.appendChild(authModal);

                const root = createRoot(authModal);
                root.render(
                  <AuthModal
                    isOpen={true}
                    onClose={() => {
                      root.unmount();
                      document.body.removeChild(authModal);
                    }}
                    onSuccess={() => {
                      root.unmount();
                      document.body.removeChild(authModal);
                    }}
                    onSignUpSuccess={() => {
                      root.unmount();
                      document.body.removeChild(authModal);
                      navigate('/verify');
                    }}
                  />
                );
              }}
              className="nav-link"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Mobile: Contact + Hamburger */}
        <div className="md:hidden flex items-center gap-4">
          {user && (
            <NotificationBell
              userRole={userRole}
              isMobile={true}
              onNavigateToAdmin={() => navigate('/admin')}
              onNavigateToDashboard={() => navigate('/dashboard')}
            />
          )}
          <Link
            to="/contact"
            className="text-text-primary hover:text-gold transition-colors font-medium text-sm"
          >
            Contact
          </Link>
          <button
            className="flex items-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
          >
            {isOpen ? <X className="h-6 w-6 text-text-primary" /> : <Menu className="h-6 w-6 text-text-primary" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`fixed top-16 left-0 right-0 border-b border-graphite shadow-2xl md:hidden z-40 ${isHomePage ? 'bg-surface/95 backdrop-blur-md' : 'bg-background/95 backdrop-blur-sm'
                }`}
            >
              <div className="py-6 px-6">
                <div className="flex flex-col space-y-1 max-w-full">
                  {(userRole === 'admin' || userRole === 'sub_admin') && (
                    <Link
                      to="/admin"
                      className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin
                    </Link>
                  )}

                  <Link to="/"
                    className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/faq"
                    className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                    onClick={() => setIsOpen(false)}
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/investor-info"
                    className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                    onClick={() => setIsOpen(false)}
                  >
                    Investor Info
                  </Link>
                  <Link
                    to="/contact"
                    className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact
                  </Link>
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                        onClick={() => setIsOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="py-3 px-4 text-lg text-left text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block w-full"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const authModal = document.createElement('div');
                        authModal.id = 'auth-modal-container';
                        document.body.appendChild(authModal);

                        const root = createRoot(authModal);
                        root.render(
                          <AuthModal
                            isOpen={true}
                            onClose={() => {
                              root.unmount();
                              document.body.removeChild(authModal);
                            }}
                            onSuccess={() => {
                              root.unmount();
                              document.body.removeChild(authModal);
                              setIsOpen(false);
                            }}
                            onSignUpSuccess={() => {
                              root.unmount();
                              document.body.removeChild(authModal);
                              setIsOpen(false);
                              navigate('/verify');
                            }}
                          />
                        );
                      }}
                      className="py-3 px-4 text-lg text-text-primary hover:text-gold hover:bg-accent rounded-lg transition-all duration-200 block"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}

                  {/* Invest Now Button */}
                  <div className="mt-6 pt-6 border-t border-graphite">
                    <Link
                      to="/onboarding-flow/subscription-agreement"
                      className="block w-full py-4 px-4 bg-gold text-background text-lg font-semibold text-center rounded-lg hover:bg-gold/90 transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Invest Now
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;