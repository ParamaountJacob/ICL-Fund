import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save } from 'lucide-react';
import { updateUserProfile, getUserProfile, supabase } from '../lib/supabase';

interface ForceProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstName?: string;
  lastName?: string;
}

const ForceProfileUpdateModal: React.FC<ForceProfileUpdateModalProps> = ({
  isOpen,
  onClose,
  firstName = '',
  lastName = ''
}) => {
  const [formData, setFormData] = useState({
    first_name: firstName,
    last_name: lastName
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name) {
      setError('Both first name and last name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('=== FORCE PROFILE UPDATE START ===');
      console.log('Saving profile with data:', formData);
      console.log('Current user from auth:', await supabase.auth.getUser());

      const result = await updateUserProfile({
        first_name: formData.first_name,
        last_name: formData.last_name
      });
      console.log('Profile update result:', result);

      // Add a longer delay to ensure database transaction completes
      console.log('Waiting for database transaction to complete...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check the profile again before closing to verify it saved
      const verifyProfile = await getUserProfile();
      console.log('Verification check - profile after save:', verifyProfile);
      console.log('=== FORCE PROFILE UPDATE END ===');

      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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
            className="bg-surface p-8 rounded-lg shadow-xl max-w-md w-full relative"
          >
            <div className="text-center mb-6">
              <div className="bg-gold/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Complete Your Profile</h2>
              <p className="text-text-secondary">
                Please provide your first and last name to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-sm uppercase tracking-wide text-text-secondary">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-background border-0 border-b border-graphite px-0 py-2 focus:ring-0 focus:border-gold text-text-primary"
                  placeholder="Your first name"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm uppercase tracking-wide text-text-secondary">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-background border-0 border-b border-graphite px-0 py-2 focus:ring-0 focus:border-gold text-text-primary"
                  placeholder="Your last name"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !formData.first_name || !formData.last_name}
                className={`button w-full flex items-center justify-center gap-2 ${loading || !formData.first_name || !formData.last_name ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save and Continue'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForceProfileUpdateModal;