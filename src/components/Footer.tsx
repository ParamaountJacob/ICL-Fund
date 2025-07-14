import React from 'react';
import { Link } from 'react-router-dom';
import { CircleDollarSign } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-graphite py-8 md:py-16 relative z-30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-8">
            <img
              src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
              alt="Inner Circle Lending"
              className="h-6 w-auto"
            />
            <span className="font-display font-semibold text-lg uppercase tracking-wide">InnerCircle</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-6 md:mb-10 px-4">
            <Link to="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              About
            </Link>
            <Link to="/faq" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              FAQ
            </Link>
            <Link to="/investor-info" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Investor Info
            </Link>
            <Link to="/contact" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Contact
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sm text-text-secondary mb-1">
              &copy; {currentYear} Inner Circle Lending. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 px-4">
              <Link to="/privacy" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                Privacy
              </Link>
              <Link to="/faq" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                FAQ
              </Link>
              <Link to="/verification" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                Verification Steps
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;