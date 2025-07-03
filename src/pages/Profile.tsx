import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';
import { AuthModal } from '../components/auth/AuthModal';
import {
  User,
  Edit,
  Save,
  DollarSign,
  Target,
  TrendingUp,
  Settings,
  Lock,
  ChevronRight
} from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  net_worth: string;
  annual_income: string;
  investment_goals: string;
}

const Profile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { addNotification } = useNotifications();
  const [profile, setProfile] = useState<Profile>({
    id: '',
    first_name: '',
    last_name: '',
    phone: '',
    net_worth: '',
    annual_income: '',
    investment_goals: ''
  }); const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingInvestment, setIsEditingInvestment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load profile data when user is available
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        addNotification('Failed to load profile', 'error');
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      addNotification('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      addNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      addNotification('Profile updated successfully!', 'success');
      setIsEditingContact(false);
      setIsEditingInvestment(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleStartInvesting = () => {
    // Navigate to investment flow
    window.location.href = '/start-investing';
  };

  const handleScheduleConsultation = () => {
    // Open contact form or scheduling
    window.location.href = '/contact';
  };

  const updateEmail = () => {
    addNotification('Email change feature coming soon', 'info');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-accent flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-surface p-8 rounded-xl border border-graphite shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-gold mb-4">Access Required</h1>
          <p className="text-text-secondary mb-8">
            Please sign in to view and manage your profile information.
          </p>
          <motion.button
            onClick={() => setShowAuthModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-to-r from-gold to-gold/80 text-dark font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Sign In / Register
          </motion.button>
        </motion.div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab="register"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-accent">
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gold mb-4"
            >
              Your Profile
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-text-secondary max-w-2xl mx-auto"
            >
              Manage your personal information and investment preferences
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gradient-to-br from-surface to-accent p-6 rounded-xl border border-graphite shadow-lg sticky top-8"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold/70 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-10 h-10 text-dark" />
                  </div>
                  <h3 className="text-lg font-semibold text-gold mb-1">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : 'Welcome'
                    }
                  </h3>
                  <p className="text-text-secondary text-sm break-all">
                    {user.email}
                  </p>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${activeTab === 'overview'
                      ? 'bg-gold/20 border-gold/30 text-gold border'
                      : 'hover:bg-gold/10 text-text-secondary hover:text-gold border border-transparent'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Overview</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>

                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${activeTab === 'edit'
                      ? 'bg-gold/20 border-gold/30 text-gold border'
                      : 'hover:bg-gold/10 text-text-secondary hover:text-gold border border-transparent'
                      }`}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="font-medium">Edit Profile</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>

                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${activeTab === 'security'
                      ? 'bg-gold/20 border-gold/30 text-gold border'
                      : 'hover:bg-gold/10 text-text-secondary hover:text-gold border border-transparent'
                      }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Security</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                </nav>

                <div className="mt-8 pt-6 border-t border-graphite">
                  <h4 className="text-sm font-semibold text-gold mb-3">Need Help?</h4>
                  <button className="w-full bg-gold/10 text-gold p-3 rounded-lg hover:bg-gold/20 transition-all duration-300 text-sm font-medium">
                    Schedule Consultation
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gold" />
                          </div>
                          <h3 className="text-xl font-semibold text-gold">Account Summary</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                            <span className="text-text-secondary font-medium">Email</span>
                            <span className="text-text-primary text-right break-all max-w-[60%]">{user?.email || 'No email provided'}</span>
                          </div>
                          <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                            <span className="text-text-secondary font-medium">Name</span>
                            <span className="text-text-primary text-right">{profile.first_name} {profile.last_name}</span>
                          </div>
                          <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                            <span className="text-text-secondary font-medium">Phone</span>
                            <span className="text-text-primary text-right">{profile.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                            <span className="text-text-secondary font-medium">Member Since</span>
                            <span className="text-text-primary text-right">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-gold" />
                          </div>
                          <h3 className="text-xl font-semibold text-gold">Investment Profile</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-accent rounded-lg border border-gold/20">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-gold" />
                              <span className="text-text-secondary font-medium">Net Worth</span>
                            </div>
                            <span className="text-text-primary text-lg font-semibold">
                              {profile.net_worth || 'Not provided'}
                            </span>
                          </div>
                          <div className="p-4 bg-accent rounded-lg border border-gold/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-gold" />
                              <span className="text-text-secondary font-medium">Annual Income</span>
                            </div>
                            <span className="text-text-primary text-lg font-semibold">
                              {profile.annual_income || 'Not provided'}
                            </span>
                          </div>
                          <div className="p-4 bg-accent rounded-lg border border-gold/20">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-gold" />
                              <span className="text-text-secondary font-medium">Investment Goals</span>
                            </div>
                            <span className="text-text-primary text-sm">
                              {profile.investment_goals || 'Not provided'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                          <Settings className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="text-xl font-semibold text-gold">Quick Actions</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => setActiveTab('edit')}
                          className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
                        >
                          <Edit className="w-5 h-5 text-gold" />
                          <span className="font-medium">Edit Profile</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('security')}
                          className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
                        >
                          <Lock className="w-5 h-5 text-gold" />
                          <span className="font-medium">Security Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'edit' && (
                  <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                        <Edit className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="text-xl font-semibold text-gold">Edit Profile</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-text-secondary font-medium mb-2">First Name</label>
                          <input
                            type="text"
                            value={profile.first_name || ''}
                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-text-secondary font-medium mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profile.last_name || ''}
                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your last name"
                          />
                        </div>
                        <div>
                          <label className="block text-text-secondary font-medium mb-2">Phone</label>
                          <input
                            type="tel"
                            value={profile.phone || ''}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-text-secondary font-medium mb-2">Net Worth</label>
                          <input
                            type="text"
                            value={profile.net_worth || ''}
                            onChange={(e) => setProfile({ ...profile, net_worth: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your net worth"
                          />
                        </div>
                        <div>
                          <label className="block text-text-secondary font-medium mb-2">Annual Income</label>
                          <input
                            type="text"
                            value={profile.annual_income || ''}
                            onChange={(e) => setProfile({ ...profile, annual_income: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your annual income"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-text-secondary font-medium mb-2">Investment Goals</label>
                          <textarea
                            value={profile.investment_goals || ''}
                            onChange={(e) => setProfile({ ...profile, investment_goals: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200 resize-none"
                            rows={4}
                            placeholder="Describe your investment goals and objectives"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-graphite">
                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-8 py-3 bg-gradient-to-r from-gold to-gold/80 text-dark font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-semibold text-gold">Account Security</h2>
                          <p className="text-text-secondary text-sm md:text-base">Keep your account safe and secure</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 bg-accent rounded-lg border border-graphite">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary">Change Password</h3>
                              <p className="text-text-secondary text-sm">Update your account password</p>
                            </div>
                            <button className="bg-gold text-background px-4 py-2 rounded-lg font-medium hover:bg-gold/90 transition-all duration-300">
                              Change Password
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-accent rounded-lg border border-graphite">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary">Two-Factor Authentication</h3>
                              <p className="text-text-secondary text-sm">Add an extra layer of security to your account</p>
                            </div>
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-300">
                              Enable 2FA
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-accent rounded-lg border border-graphite">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary">Login History</h3>
                              <p className="text-text-secondary text-sm">View recent account activity</p>
                            </div>
                            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300">
                              View History
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-semibold text-gold">Account Information</h2>
                          <p className="text-text-secondary text-sm md:text-base">Account details and activity</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Account Created:</span>
                            <span className="text-text-primary">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Last Sign In:</span>
                            <span className="text-text-primary">{user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Email Confirmed:</span>
                            <span className="text-text-primary">{user?.email_confirmed_at ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default Profile;
import {
  FileText,
  User,
  Mail,
  Calendar,
  Phone,
  Building,
  Edit,
  Save,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Settings,
  DollarSign,
  Target,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Wallet,
  ArrowRight,
  MessageCircle
} from 'lucide-react';

interface UserProfile {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  ira_accounts: string;
  investment_goals: string;
  net_worth: string;
  annual_income: string;
}

type DocumentType = 'pitch_deck' | 'ppm' | 'wire_instructions';

const Profile: React.FC = () => {
  const { user, profile: authProfile, loading, refreshProfile } = useAuth();
  const { success, error: showError } = useNotifications();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile>({
    first_name: authProfile?.first_name || '',
    last_name: authProfile?.last_name || '',
    phone: authProfile?.phone || '',
    address: authProfile?.address || '',
    ira_accounts: authProfile?.ira_accounts || '',
    investment_goals: authProfile?.investment_goals || '',
    net_worth: authProfile?.net_worth || '',
    annual_income: authProfile?.annual_income || ''
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'security'>('overview');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingInvestment, setIsEditingInvestment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [documentAccess, setDocumentAccess] = useState<Record<DocumentType, boolean>>({
    pitch_deck: false,
    ppm: false,
    wire_instructions: false
  });

  // Helper function for formatting dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    if (authProfile) {
      setProfile({
        first_name: authProfile.first_name || '',
        last_name: authProfile.last_name || '',
        phone: authProfile.phone || '',
        address: authProfile.address || '',
        ira_accounts: authProfile.ira_accounts || '',
        investment_goals: authProfile.investment_goals || '',
        net_worth: authProfile.net_worth || '',
        annual_income: authProfile.annual_income || ''
      });
    }
    fetchDocumentAccess();
  }, [authProfile]);

  const fetchDocumentAccess = async () => {
    try {
      // Skip document access checking for now since tables may not exist
      // This will be restored after the database cleanup
      setDocumentAccess({
        pitch_deck: false,
        ppm: false,
        wire_instructions: false
      });
    } catch (error) {
      logger.error('Error fetching document access:', error);
      // Set default values on error
      setDocumentAccess({
        pitch_deck: false,
        ppm: false,
        wire_instructions: false
      });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartInvesting = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    navigate('/onboarding');
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/onboarding');
  };

  const handleScheduleConsultation = () => {
    // You can implement this to open a calendar link or contact form
    window.open('mailto:contact@innercirclelending.com?subject=Schedule Investment Consultation', '_blank');
  }; const saveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Try to update profiles table, handle case where it might not exist yet
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          address: profile.address,
          ira_accounts: profile.ira_accounts,
          investment_goals: profile.investment_goals,
          net_worth: profile.net_worth,
          annual_income: profile.annual_income,
          updated_at: new Date().toISOString()
        });

      if (error) {
        // If profiles table doesn't exist, show a helpful message
        if (error.code === '42P01') {
          showError('Database not yet configured. Please run the database migration first.');
          return;
        }
        throw error;
      }

      await refreshProfile();
      setIsEditingContact(false);
      setIsEditingInvestment(false);
      success('Profile updated successfully!');
    } catch (error: any) {
      showError('Failed to update profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsEditingContact(false);
      setIsEditingInvestment(false);
      success('Password updated successfully!');
    } catch (error: any) {
      showError('Failed to update password: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = async () => {
    const newEmail = prompt('Enter your new email address:');
    if (!newEmail) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      success('Email update sent! Please check your email to confirm the change.');
    } catch (error: any) {
      showError('Failed to update email: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'pitch_deck':
        return <FileText className="w-5 h-5 text-gold" />;
      case 'ppm':
        return <FileCheck className="w-5 h-5 text-gold" />;
      case 'wire_instructions':
        return <Wallet className="w-5 h-5 text-gold" />;
      default:
        return <FileText className="w-5 h-5 text-gold" />;
    }
  };

  const getDocumentName = (type: DocumentType) => {
    switch (type) {
      case 'pitch_deck':
        return 'Pitch Deck';
      case 'ppm':
        return 'PPM & Subscription';
      case 'wire_instructions':
        return 'Wire Instructions';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Verified</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Pending</span>;
    }
  };

  // Handle loading state - prevents infinite loading on missing database tables
  if (loading) {
    return (
      <div className="pt-20 md:pt-28">
        <section className="py-12 md:py-24">
          <div className="px-4 md:px-6 max-w-6xl mx-auto">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading profile...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="pt-20 md:pt-28">
        <section className="py-12 md:py-24">
          <div className="px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Authentication Required</h2>
              <p className="text-text-secondary mb-6">Please log in to access your profile.</p>
              <button
                onClick={() => window.location.href = '/'}
                className="btn-primary"
              >
                Go to Home
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface">
      {/* Professional Header */}
      <section className="relative bg-gradient-to-r from-surface via-accent to-surface border-b border-graphite">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gold mb-4">
                Investment Profile
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
                Manage your account settings, investment preferences, and security details
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Professional Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-surface to-accent p-8 rounded-2xl border border-graphite shadow-xl sticky top-8"
              >
                {/* Professional Avatar Section */}
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-gold to-gold/80 rounded-full flex items-center justify-center shadow-lg ring-4 ring-gold/20">
                      <User className="w-12 h-12 text-background" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-surface flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-text-primary">
                      {profile.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : 'Investment Profile'
                      }
                    </h3>
                    <p className="text-text-secondary text-sm break-all">{user?.email}</p>
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified Investor
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="space-y-2">
                  {[
                    { id: 'overview', label: 'Portfolio Overview', icon: TrendingUp },
                    { id: 'personal', label: 'Personal Information', icon: User },
                    { id: 'security', label: 'Security Settings', icon: Shield }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${activeTab === tab.id
                          ? 'bg-gold text-background shadow-lg scale-105'
                          : 'text-text-secondary hover:bg-gold/10 hover:text-gold border border-transparent hover:border-gold/20'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 pt-6 border-t border-graphite">
                  <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={handleStartInvesting}
                      className="w-full bg-gradient-to-r from-gold to-gold/90 text-background px-4 py-3 rounded-xl font-semibold hover:from-gold/90 hover:to-gold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <DollarSign className="w-4 h-4" />
                      Start Investing
                    </button>
                    <button
                      onClick={handleScheduleConsultation}
                      className="w-full bg-surface border border-gold/30 text-gold px-4 py-3 rounded-xl font-medium hover:bg-gold/10 transition-all duration-300 flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Consultation
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Account Summary */}
                    <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="text-xl font-semibold text-gold">Account Summary</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                          <span className="text-text-secondary font-medium">Email</span>
                          <span className="text-text-primary text-right break-all max-w-[60%]">{user?.email || 'No email provided'}</span>
                        </div>
                        <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                          <span className="text-text-secondary font-medium">Name</span>
                          <span className="text-text-primary text-right">{profile.first_name} {profile.last_name}</span>
                        </div>
                        <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                          <span className="text-text-secondary font-medium">Phone</span>
                          <span className="text-text-primary text-right">{profile.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                          <span className="text-text-secondary font-medium">Member Since</span>
                          <span className="text-text-primary text-right">January 15, 2024</span>
                        </div>
                      </div>
                    </div>

                    {/* Investment Profile */}
                    <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="text-xl font-semibold text-gold">Investment Profile</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-accent rounded-lg border border-gold/20">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-gold" />
                            <span className="text-text-secondary font-medium">Net Worth</span>
                          </div>
                          <span className="text-text-primary text-lg font-semibold">
                            {profile.net_worth || 'Not provided'}
                          </span>
                        </div>
                        <div className="p-4 bg-accent rounded-lg border border-gold/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-gold" />
                            <span className="text-text-secondary font-medium">Annual Income</span>
                          </div>
                          <span className="text-text-primary text-lg font-semibold">
                            {profile.annual_income || 'Not provided'}
                          </span>
                        </div>
                        <div className="p-4 bg-accent rounded-lg border border-gold/20">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-gold" />
                            <span className="text-text-secondary font-medium">Investment Goals</span>
                          </div>
                          <span className="text-text-primary text-sm">
                            {profile.investment_goals || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-accent rounded-lg border border-gold/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gold" />
                    <span className="text-text-secondary font-medium">Annual Income</span>
                  </div>
                  <span className="text-text-primary text-lg font-semibold">
                    {profile.annual_income || 'Not provided'}
                  </span>
                </div>
                {profile.ira_accounts && (
                  <div className="p-4 bg-gold/10 rounded-lg border border-gold/30">
                    <span className="text-text-secondary font-medium">Retirement Accounts:</span>
                    <p className="text-text-primary mt-2">{profile.ira_accounts}</p>
                  </div>
                )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg hover:shadow-xl transition-all duration-300 lg:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-gold">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleStartInvesting}
                className="w-full text-left p-4 bg-gradient-to-r from-gold/20 to-gold/10 border-2 border-gold/30 rounded-lg hover:bg-gold/30 hover:border-gold/50 transition-all duration-300 flex items-center gap-3"
              >
                <TrendingUp className="w-5 h-5 text-gold" />
                <span className="font-medium text-gold">Start Investing</span>
              </button>
              <button
                onClick={handleScheduleConsultation}
                className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
              >
                <MessageCircle className="w-5 h-5 text-gold" />
                <span className="font-medium">Schedule Consultation</span>
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
              >
                <Edit className="w-5 h-5 text-gold" />
                <span className="font-medium">Edit Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
              >
                <Lock className="w-5 h-5 text-gold" />
                <span className="font-medium">Security Settings</span>
              </button>
            </div>
          </div>
        </motion.div>
            )}

        {activeTab === 'personal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Contact Information Section */}
            <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gold">Contact Information</h2>
                    <p className="text-text-secondary text-sm md:text-base">Manage your personal contact details</p>
                  </div>
                </div>
                <button
                  onClick={() => isEditingContact ? saveProfile() : setIsEditingContact(true)}
                  disabled={isLoading}
                  className="bg-gold text-background px-6 py-3 rounded-lg font-medium hover:bg-gold/90 transition-all duration-300 flex items-center gap-2 shadow-lg"
                >
                  {isEditingContact ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {isLoading ? 'Saving...' : isEditingContact ? 'Save Changes' : 'Edit Contact Info'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      First Name
                    </label>
                    {isEditingContact ? (
                      <input
                        type="text"
                        name="first_name"
                        value={profile.first_name}
                        onChange={handleProfileChange}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                        placeholder="Your first name"
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite">
                        <p className="text-text-primary">{profile.first_name || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Last Name
                    </label>
                    {isEditingContact ? (
                      <input
                        type="text"
                        name="last_name"
                        value={profile.last_name}
                        onChange={handleProfileChange}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                        placeholder="Your last name"
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite">
                        <p className="text-text-primary">{profile.last_name || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Email Address
                    </label>
                    <div className="p-3 bg-accent rounded-lg border border-graphite flex items-center justify-between">
                      <span className="text-text-primary break-all">{user?.email}</span>
                      <button
                        onClick={updateEmail}
                        className="text-gold hover:text-gold/80 text-sm font-medium ml-4 whitespace-nowrap"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Phone Number
                    </label>
                    {isEditingContact ? (
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                        placeholder="(555) 123-4567"
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite">
                        <p className="text-text-primary">{profile.phone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Address
                    </label>
                    {isEditingContact ? (
                      <textarea
                        name="address"
                        value={profile.address}
                        onChange={handleProfileChange}
                        rows={4}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                        placeholder="Your mailing address"
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite min-h-[100px]">
                        <p className="text-text-primary whitespace-pre-line">{profile.address || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditingContact && (
                <div className="mt-6 pt-6 border-t border-graphite flex justify-end gap-4">
                  <button
                    onClick={() => setIsEditingContact(false)}
                    className="px-6 py-2 border border-graphite text-text-secondary rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Investment Profile Section */}
            <div className="bg-gradient-to-br from-surface to-accent p-6 md:p-8 rounded-xl border border-graphite shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gold">Investment Profile</h2>
                    <p className="text-text-secondary text-sm md:text-base">Manage your investment preferences and financial information</p>
                  </div>
                </div>
                <button
                  onClick={() => isEditingInvestment ? saveProfile() : setIsEditingInvestment(true)}
                  disabled={isLoading}
                  className="bg-gold text-background px-6 py-3 rounded-lg font-medium hover:bg-gold/90 transition-all duration-300 flex items-center gap-2 shadow-lg"
                >
                  {isEditingInvestment ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {isLoading ? 'Saving...' : isEditingInvestment ? 'Save Changes' : 'Edit Investment Info'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Estimated Net Worth
                    </label>
                    {isEditingInvestment ? (
                      <select
                        name="net_worth"
                        value={profile.net_worth}
                        onChange={handleProfileChange}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                      >
                        <option value="">Select range</option>
                        <option value="$500K - $1M">$500K - $1M</option>
                        <option value="$1M - $5M">$1M - $5M</option>
                        <option value="$5M - $10M">$5M - $10M</option>
                        <option value="$10M+">$10M+</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite">
                        <p className="text-text-primary">{profile.net_worth || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Annual Income
                    </label>
                    {isEditingInvestment ? (
                      <select
                        name="annual_income"
                        value={profile.annual_income}
                        onChange={handleProfileChange}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                      >
                        <option value="">Select range</option>
                        <option value="$200K - $500K">$200K - $500K</option>
                        <option value="$500K - $1M">$500K - $1M</option>
                        <option value="$1M - $2M">$1M - $2M</option>
                        <option value="$2M+">$2M+</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite">
                        <p className="text-text-primary">{profile.annual_income || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      IRA/401(k) Account Names
                    </label>
                    {isEditingInvestment ? (
                      <textarea
                        name="ira_accounts"
                        value={profile.ira_accounts}
                        onChange={handleProfileChange}
                        rows={3}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                        placeholder="List your retirement account providers"
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite min-h-[80px]">
                        <p className="text-text-primary whitespace-pre-line">{profile.ira_accounts || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Investment Goals
                    </label>
                    {isEditingInvestment ? (
                      <textarea
                        name="investment_goals"
                        value={profile.investment_goals}
                        onChange={handleProfileChange}
                        rows={6}
                        className="w-full bg-background border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                        placeholder="Describe your investment objectives and goals"
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg border border-graphite min-h-[140px]">
                        <p className="text-text-primary whitespace-pre-line">{profile.investment_goals || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditingInvestment && (
                <div className="mt-6 pt-6 border-t border-graphite flex justify-end gap-4">
                  <button
                    onClick={() => setIsEditingInvestment(false)}
                    className="px-6 py-2 border border-graphite text-text-secondary rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-surface p-4 md:p-8 rounded-lg border border-graphite"
          >
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-gold" />
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">Security Settings</h2>
                <p className="text-text-secondary text-sm md:text-base">Manage your account security and authentication</p>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              {/* Email Management */}
              <div className="border border-graphite rounded-lg p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gold mb-4">Email Address</h3>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-text-primary font-medium break-all">{user?.email}</p>
                    <p className="text-text-secondary text-sm">Your primary email address for account access</p>
                  </div>
                  <button
                    onClick={updateEmail}
                    disabled={isLoading}
                    className="button-gold px-4 py-2 w-full md:w-auto"
                  >
                    Change Email
                  </button>
                </div>
              </div>

              {/* Password Management */}
              <div className="border border-graphite rounded-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg font-semibold text-gold">Password</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="button-gold px-4 py-2 w-full md:w-auto"
                  >
                    {isEditing ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={updatePassword}
                        disabled={isLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="button px-6 py-2 flex items-center gap-2 w-full md:w-auto"
                      >
                        <Lock className="w-4 h-4" />
                        {isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>

                    <div className="bg-gold/10 border border-gold/20 p-4 rounded-lg">
                      <p className="text-gold text-sm">
                        <strong>Password Requirements:</strong>
                        <br />• At least 6 characters long
                        <br />• Use a combination of letters, numbers, and symbols for better security
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-text-primary">••••••••••••</p>
                    <p className="text-text-secondary text-sm">Last updated: {user?.updated_at ? formatDate(user.updated_at) : 'Never'}</p>
                  </div>
                )}
              </div>

              {/* Account Security Info */}
              <div className="bg-accent border border-graphite rounded-lg p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gold mb-4">Account Security</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Account Created:</span>
                    <span className="text-text-primary">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last Sign In:</span>
                    <span className="text-text-primary">{user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email Confirmed:</span>
                    <span className="text-text-primary">{user?.email_confirmed_at ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
      </section >

  {/* Auth Modal */ }
  < AuthModal
isOpen = { showAuthModal }
onClose = {() => setShowAuthModal(false)}
defaultTab = "register"
  />
    </div >
  );
};

export default Profile;