import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { subscribeToNewsletter } from '../lib/supabase';
import { SuccessModal } from './SuccessModal';

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await subscribeToNewsletter(email);
      setEmail('');
      setShowSuccessModal(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to subscribe. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface p-6 md:p-8 rounded-lg border border-graphite">
      <div className="text-center mb-6">
        <Mail className="w-12 h-12 text-gold mx-auto mb-4" />
        <h3 className="text-xl md:text-2xl font-display font-semibold mb-2">Stay Informed</h3>
        <p className="text-text-secondary text-sm md:text-base">
          Get exclusive insights on private lending opportunities and market updates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="flex-1 bg-background border border-graphite rounded-lg md:border-0 md:border-b md:rounded-none px-4 py-3 md:px-0 focus:ring-2 focus:ring-gold/20 md:focus:ring-0 focus:border-gold text-text-primary placeholder-text-secondary transition-all duration-200"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className={`button px-6 py-3 flex items-center justify-center gap-2 whitespace-nowrap ${
              loading || !email ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send className="w-4 h-4" />
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </form>

      <p className="text-xs text-text-secondary text-center mt-4">
        We respect your privacy. Unsubscribe at any time.
      </p>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Successfully Subscribed!"
        message="Thank you for subscribing to our newsletter. You'll receive exclusive insights on private lending opportunities and market updates."
      />
    </div>
  );
};

export default NewsletterSignup;