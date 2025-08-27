import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Send, User } from 'lucide-react';

interface ContactRequest {
  id: string;
  subject?: string;
  message?: string;
  created_at: string;
  status?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [email, setEmail] = useState<string>(user?.email || '');
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user?.email]);

  useEffect(() => {
    const fetchContactRequests = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('contact_requests')
          .select('id, subject, message, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setContactRequests(data || []);
      } catch (e: any) {
        console.error('Failed to load contact requests:', e.message);
        setContactRequests([]);
      }
    };
    fetchContactRequests();
  }, [user]);

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true); setMessage(null); setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage('Email update requested. Please check your inbox to confirm.');
    } catch (e: any) {
      setError(e.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(null); setError(null);
    try {
      if (!passwords.next || passwords.next !== passwords.confirm) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: passwords.next });
      if (error) throw error;
      setMessage('Password updated successfully.');
      setPasswords({ next: '', confirm: '' });
    } catch (e: any) {
      setError(e.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-28">
        <section className="py-24 md:py-32">
          <div className="section">
            <div className="max-w-xl mx-auto text-center">
              <h1 className="heading mb-4">Profile</h1>
              <p className="text-text-secondary">Please sign in to view your profile.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28">
      <section className="py-16">
        <div className="section">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <User className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">Your Profile</h1>
                <p className="text-sm text-text-secondary">Basic account management</p>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface p-6 rounded-lg border border-graphite">
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-5 h-5 text-gold" />
                <h2 className="font-semibold text-text-primary">Contact Requests You Sent</h2>
              </div>
              {contactRequests.length === 0 ? (
                <p className="text-text-secondary text-sm">No contact requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {contactRequests.map((r) => (
                    <div key={r.id} className="p-3 bg-accent rounded-lg border border-graphite">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{r.subject || 'Contact Request'}</div>
                          <div className="text-xs text-text-secondary mt-1 line-clamp-2">{r.message}</div>
                        </div>
                        <div className="text-xs text-text-secondary ml-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                      {r.status && (
                        <div className="mt-1 text-xs text-text-secondary">Status: {r.status}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface p-6 rounded-lg border border-graphite">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-gold" />
                <h2 className="font-semibold text-text-primary">Change Email</h2>
              </div>
              <form onSubmit={updateEmail} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/30"
                  placeholder="you@example.com"
                  required
                />
                <button disabled={loading} className="button">
                  {loading ? 'Updating…' : 'Update Email'}
                </button>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface p-6 rounded-lg border border-graphite">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-gold" />
                <h2 className="font-semibold text-text-primary">Change Password</h2>
              </div>
              <form onSubmit={updatePassword} className="space-y-3">
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                  className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/30"
                  placeholder="New password"
                  required
                />
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/30"
                  placeholder="Confirm new password"
                  required
                />
                <button disabled={loading} className="button">
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </motion.div>

            {(message || error) && (
              <div className={`p-3 rounded-lg ${error ? 'bg-red-500/10 border border-red-500/30 text-red-600' : 'bg-green-500/10 border border-green-500/30 text-green-600'}`}>
                {error || message}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;