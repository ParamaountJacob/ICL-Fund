import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, FileText, Bell } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
    // Only set scrolled state for non-home pages
    if (pathname !== '/') {
      setIsScrolled(true);
    }
  }, [pathname]);

  // Determine if this is the home page
  const isHomePage = pathname === '/';

  // Get scroll-based transform for smooth sliding - adjusted thresholds to prevent clipping
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [500, 800], [-60, 0], { clamp: true });
  const headerOpacity = useTransform(scrollY, [500, 800], [0, 1], { clamp: true });

  // Header should slide smoothly based on scroll position
  const headerClasses = isHomePage
    ? 'fixed top-0 left-0 right-0 z-[60] py-4 bg-background/95 shadow-md backdrop-blur-sm'
    : 'fixed top-0 left-0 right-0 z-[60] py-4 bg-background/95 backdrop-blur-sm shadow-md';

  const headerStyle = isHomePage ? {
    y: headerY,
    opacity: headerOpacity,
    willChange: 'transform, opacity'
  } : {};

  return (
    <>
      <motion.header
        className={headerClasses}
        style={headerStyle}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        <div className="container px-4 md:px-6 mx-auto flex items-center justify-between max-w-full">
          <Link
            to="/"
            className="flex items-center space-x-2 text-text-primary"
            onClick={(e) => {
              // If already on the home page, prevent redundant navigation and scroll to top
              if (pathname === '/') {
                e.preventDefault();
                try {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch {
                  // Fallback for older browsers
                  window.scrollTo(0, 0);
                }
              }
            }}
          >
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
              className="flex items-center p-2 hover:bg-gold/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close Menu" : "Open Menu"}
            >
              {isOpen ? <X className="h-6 w-6 text-text-primary" /> : <Menu className="h-6 w-6 text-text-primary" />}
            </button>
          </div>        </div>
      </motion.header>

      {/* Mobile Menu - Completely outside header */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Right-sliding menu overlay */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] md:hidden z-[9999] ${isHomePage ? 'bg-surface/95 backdrop-blur-lg border-l border-graphite/30' : 'bg-background/95 backdrop-blur-lg border-l border-graphite/30'
                } shadow-2xl overflow-hidden`}
            >
              {/* Header with Menu text and close button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-graphite/20">
                <h2 className="text-lg font-semibold text-text-primary uppercase tracking-wide">Menu</h2>
                <button
                  className="flex items-center p-2 hover:bg-graphite/10 rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Menu"
                >
                  <X className="h-6 w-6 text-text-primary" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="px-6 py-4 h-full overflow-y-auto">
                <div className="flex flex-col space-y-1">
                  <Link to="/"
                    className="block py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors border-b border-graphite/20"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link to="/investor-info"
                    className="block py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors border-b border-graphite/20"
                    onClick={() => setIsOpen(false)}
                  >
                    Investor Info
                  </Link>
                  <Link to="/about"
                    className="block py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors border-b border-graphite/20"
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>
                  <Link to="/faq"
                    className="block py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors border-b border-graphite/20"
                    onClick={() => setIsOpen(false)}
                  >
                    FAQ
                  </Link>
                  <Link to="/contact"
                    className="block py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors border-b border-graphite/20"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact
                  </Link>

                  {/* User-specific mobile menu items */}
                  {user && (
                    <>
                      <div className="py-2">
                        <div className="w-full h-px bg-gold/30"></div>
                      </div>
                      <Link to="/pitch-deck"
                        className="flex items-center gap-4 py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors border-b border-graphite/20"
                        onClick={() => setIsOpen(false)}
                      >
                        <FileText className="w-5 h-5" />
                        Pitch Deck
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setShowNotificationModal(true);
                        }}
                        className="flex items-center justify-between py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors w-full text-left border-b border-graphite/20"
                      >
                        <div className="flex items-center gap-4">
                          <Bell className="w-5 h-5" />
                          Notifications
                        </div>
                        {unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                      </button>
                      <Link to="/profile"
                        className="flex items-center gap-4 py-4 text-lg font-medium text-text-primary hover:text-gold transition-colors border-b border-graphite/20"
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        Profile
                      </Link>
                      <div className="py-2">
                        <div className="w-full h-px bg-gold/30"></div>
                      </div>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-4 py-4 text-lg font-medium text-red-500 hover:text-red-400 transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </>
  );
};

export default Navbar;