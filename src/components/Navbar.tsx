import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();

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
          <Link to="/investor-info" className="nav-link">
            Investor Info
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/pitch-deck" className="nav-link">
            Pitch Deck
          </Link>
          <Link to="/faq" className="nav-link">
            FAQ
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          <Link to="/profile" className="nav-link">
            Profile (Demo)
          </Link>
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
                  <Link to="/pitch-deck"
                    className="block py-3 text-base font-medium text-text-primary hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Pitch Deck
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
                  <Link to="/profile"
                    className="block py-3 text-base font-medium text-text-primary hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile (Demo)
                  </Link>
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