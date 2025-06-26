import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

// We change this from a default to a named export by adding "export"
export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-surface p-8 rounded-lg shadow-xl max-w-md w-full text-center"
          >
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-gold" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>
            <p className="text-text-secondary mb-8">{message}</p>
            <button onClick={onClose} className="button w-full">
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// With the change above, the "export default" line is no longer necessary.