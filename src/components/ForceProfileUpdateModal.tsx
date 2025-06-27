import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save } from 'lucide-react';
import { updateUserProfile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useFormValidation } from '../hooks/useFormValidation';

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
  const { refreshProfile } = useAuth();
  const { success, error: showError } = useNotifications();
  const [loading, setLoading] = useState(false);

  // Form validation setup
  const {
    values,
    errors,
    setValue,
    setFieldTouched,
    validateAllFields,
    resetForm
  } = useFormValidation(
    {
      first_name: firstName,
      last_name: lastName
    },
    {
      first_name: { required: true, minLength: 2 },
      last_name: { required: true, minLength: 2 }
    }
  );

  // Update form when props change
  useEffect(() => {
    setValue('first_name', firstName);
    setValue('last_name', lastName);
  }, [firstName, lastName, setValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }

    setLoading(true);

    try {
      console.log('=== FORCE PROFILE UPDATE START ===');
      console.log('Saving profile with data:', values);

      await updateUserProfile({
        first_name: values.first_name,
        last_name: values.last_name
      });

      console.log('Profile update successful');

      // Refresh the profile in auth context
      await refreshProfile();

      success('Profile Updated', 'Your profile has been saved successfully.');
      onClose();

      console.log('=== FORCE PROFILE UPDATE END ===');
    } catch (err) {
      console.error('Error updating profile:', err);
      showError('Save Failed', 'An error occurred while saving your profile. Please try again.');
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
                  value={values.first_name}
                  onChange={(e) => setValue('first_name', e.target.value)}
                  onBlur={() => setFieldTouched('first_name')}
                  required
                  className={`w-full bg-background border-0 border-b px-0 py-2 focus:ring-0 text-text-primary ${errors.first_name ? 'border-red-500 focus:border-red-500' : 'border-graphite focus:border-gold'
                    }`}
                  placeholder="Your first name"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm uppercase tracking-wide text-text-secondary">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={values.last_name}
                  onChange={(e) => setValue('last_name', e.target.value)}
                  onBlur={() => setFieldTouched('last_name')}
                  required
                  className={`w-full bg-background border-0 border-b px-0 py-2 focus:ring-0 text-text-primary ${errors.last_name ? 'border-red-500 focus:border-red-500' : 'border-graphite focus:border-gold'
                    }`}
                  placeholder="Your last name"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0 || !values.first_name || !values.last_name}
                className={`button w-full flex items-center justify-center gap-2 ${loading || Object.keys(errors).length > 0 || !values.first_name || !values.last_name
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
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