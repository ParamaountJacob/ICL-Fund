import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, FileText, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import NotificationModal from './NotificationModal';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  // Determine if this is the home page
  const isHomePage = pathname === '/';

  // Header should be transparent on home page when not scrolled
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link to="/" className="nav-link">
            HOME
          </Link>
          <Link to="/about" className="nav-link">
            ABOUT
          </Link>
          <Link to="/faq" className="nav-link">
            FAQ
          </Link>
          <Link to="/investor-info" className="nav-link">
            INVESTOR INFO
          </Link>
          <Link to="/contact" className="nav-link">
            CONTACT
          </Link>
          {user && (<div className="relative" ref={profileDropdownRef}>
            <button
              onMouseEnter={() => setShowProfileDropdown(true)}
              onMouseLeave={() => setShowProfileDropdown(false)}
              className="p-2 rounded-full bg-accent hover:bg-gold/20 transition-all duration-200 flex items-center gap-2 relative"
            >
              <User className="w-5 h-5 text-gold" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium min-w-[20px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-surface border border-graphite rounded-lg shadow-lg py-2 z-50"
                  onMouseEnter={() => setShowProfileDropdown(true)}
                  onMouseLeave={() => setShowProfileDropdown(false)}
                >
                  <Link
                    to="/pitch-deck"
                    className="flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-accent hover:text-gold transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <FileText className="w-4 h-4" />
                    Pitch Deck
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowNotificationModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-accent hover:text-gold transition-colors text-left"
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <div className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium min-w-[20px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </button>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-accent hover:text-gold transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <hr className="my-1 border-graphite" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-accent hover:text-gold transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </nav>

        {/* Mobile: Just Contact + Hamburger */}
        <div className="md:hidden flex items-center gap-4">
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
                  <Link to="/"
                    className="block py-3 text-base font-medium text-text-primary hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link to="/investor-info"
                    className="block py-3 text-base font-medium text-text-primary hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Investor Info
                  </Link>
                  <Link to="/about"
                    className="block py-3 text-base font-medium text-text-primary hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>
                  <Link to="/faq"
                    className="block py-3 text-base font-medium text-text-primary hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    FAQ
                  </Link>
                  <Link to="/contact"
                    className="block py-3 text-base font-medium text-text-primary hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact
                  </Link>
                  {user && (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 py-3 text-base font-medium text-text-primary hover:text-gold transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </header>
  );
};

export default Navbar;