import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSignUpSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const handleDemoClose = () => {
    console.log('DEMO MODE: Authentication system disabled');
    onSuccess(); // Simulate successful authentication
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface p-8 rounded-lg shadow-xl max-w-md w-full relative border border-gold/20"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-gold" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-text-primary">Demo Mode</h2>
                <p className="text-text-secondary leading-relaxed">
                  This is a demo version of Inner Circle Lending. Authentication and user accounts
                  have been disabled to showcase the user interface design.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDemoClose}
                  className="w-full bg-gold text-background py-3 px-4 rounded-lg font-medium hover:bg-gold/90 transition-colors"
                >
                  Continue Demo
                </button>
                <button
                  onClick={onClose}
                  className="w-full border border-graphite text-text-secondary py-3 px-4 rounded-lg font-medium hover:border-gold/50 hover:text-text-primary transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;