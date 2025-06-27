import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, getUserProfile } from '../lib/supabase';
import {
  FileText,
  FileCheck,
  Wallet,
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
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import type { DocumentType } from '../lib/supabase';
import { SuccessModal } from '../components/SuccessModal';
import AuthModal from '../components/AuthModal';

interface DocumentRequest {
  document_type: DocumentType;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

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

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    ira_accounts: '',
    investment_goals: '',
    net_worth: '',
    annual_income: ''
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'security' | 'documents'>('overview');
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchProfile(user.id);
      } else {
        setShowAuthModal(true);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setShowAuthModal(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setShowAuthModal(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          address: data.address || '',
          ira_accounts: data.ira_accounts || '',
          investment_goals: data.investment_goals || '',
          net_worth: data.net_worth || '',
          annual_income: data.annual_income || ''
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
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

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const upsertData = profile.id
        ? { id: profile.id, user_id: user.id, ...profile, updated_at: new Date().toISOString() }
        : { user_id: user.id, ...profile, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (error) throw error;

      setEditingPersonal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
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
      setEditingPassword(false);
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async () => {
    const newEmail = prompt('Enter your new email address:');
    if (!newEmail) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;
      alert('Email update initiated. Please check your new email for confirmation.');
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Failed to update email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (showAuthModal) {
    return (
      <div className="pt-28">
        <section className="py-24 md:py-32">
          <div className="section">
            <div className="max-w-md mx-auto">
              <AuthModal
                isOpen={true}
                onClose={() => window.location.href = '/'}
                onSuccess={() => setShowAuthModal(false)}
                onSignUpSuccess={() => {
                  setShowAuthModal(false);
                  navigate('/verify');
                }}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-28">
      <section className="py-12 md:py-24">
        <div className="px-4 md:px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full"
          >
            {/* Header */}
            <div className="bg-surface p-4 md:p-8 rounded-lg mb-6 md:mb-8 border border-graphite">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 md:w-10 md:h-10 text-gold" />
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">My Profile</h1>
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-text-secondary text-sm md:text-base">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="break-all">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                    </div>
                    {profile.first_name && profile.last_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{profile.first_name} {profile.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-6 md:mb-8">
              <div className="bg-surface p-1 rounded-lg border border-graphite w-full max-w-2xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${activeTab === 'overview'
                      ? 'bg-gold text-background'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <Settings className="w-4 h-4 inline mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-3 py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${activeTab === 'personal'
                      ? 'bg-gold text-background'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <User className="w-4 h-4 inline mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Personal</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`px-3 py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${activeTab === 'security'
                      ? 'bg-gold text-background'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <Shield className="w-4 h-4 inline mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Security</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-3 py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${activeTab === 'documents'
                      ? 'bg-gold text-background'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <FileText className="w-4 h-4 inline mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Documents</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8"
              >
                {/* Account Summary */}
                <div className="bg-surface p-4 md:p-6 rounded-lg border border-graphite">
                  <h3 className="text-lg font-semibold text-gold mb-4">Account Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-text-secondary text-sm">Email</span>
                      <span className="text-text-primary text-sm text-right break-all">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-text-secondary text-sm">Name</span>
                      <span className="text-text-primary text-sm text-right">{profile.first_name} {profile.last_name}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-text-secondary text-sm">Phone</span>
                      <span className="text-text-primary text-sm text-right">{profile.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-text-secondary text-sm">Member Since</span>
                      <span className="text-text-primary text-sm text-right">
                        {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-text-secondary text-sm">Last Updated</span>
                      <span className="text-text-primary text-sm text-right">
                        {user?.updated_at ? formatDate(user.updated_at) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Investment Profile */}
                <div className="bg-surface p-4 md:p-6 rounded-lg border border-graphite">
                  <h3 className="text-lg font-semibold text-gold mb-4">Investment Profile</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span className="text-text-secondary text-sm">Net Worth:</span>
                      <span className="text-text-primary text-sm">
                        {profile.net_worth || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gold" />
                      <span className="text-text-secondary text-sm">Annual Income:</span>
                      <span className="text-text-primary text-sm">
                        {profile.annual_income || 'Not provided'}
                      </span>
                    </div>
                    {profile.ira_accounts && (
                      <div className="pt-2 border-t border-graphite">
                        <span className="text-text-secondary text-sm">Retirement Accounts:</span>
                        <p className="text-text-primary text-sm mt-1">{profile.ira_accounts}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-surface p-4 md:p-6 rounded-lg border border-graphite lg:col-span-2 xl:col-span-1">
                  <h3 className="text-lg font-semibold text-gold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('personal')}
                      className="w-full text-left p-3 bg-accent rounded-lg hover:bg-gold/10 transition-colors flex items-center gap-3"
                    >
                      <Edit className="w-4 h-4 text-gold" />
                      <span>Edit Personal Information</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className="w-full text-left p-3 bg-accent rounded-lg hover:bg-gold/10 transition-colors flex items-center gap-3"
                    >
                      <Lock className="w-4 h-4 text-gold" />
                      <span>Change Password</span>
                    </button>
                    <button
                      onClick={updateEmail}
                      className="w-full text-left p-3 bg-accent rounded-lg hover:bg-gold/10 transition-colors flex items-center gap-3"
                    >
                      <Mail className="w-4 h-4 text-gold" />
                      <span>Update Email</span>
                    </button>
                    <Link
                      to="/investor-info"
                      className="block w-full text-left p-3 bg-accent rounded-lg hover:bg-gold/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gold" />
                        <span>View Investment Documents</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'personal' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-surface p-4 md:p-8 rounded-lg border border-graphite"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <User className="w-6 h-6 md:w-8 md:h-8 text-gold" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold">Personal Information</h2>
                      <p className="text-text-secondary text-sm md:text-base">Manage your profile and investment preferences</p>
                    </div>
                  </div>
                  <button
                    onClick={() => editingPersonal ? saveProfile() : setEditingPersonal(true)}
                    disabled={loading}
                    className="button flex items-center gap-2 w-full md:w-auto justify-center"
                  >
                    {editingPersonal ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {loading ? 'Saving...' : editingPersonal ? 'Save Changes' : 'Edit Information'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Contact Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gold mb-4">Contact Information</h3>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        <User className="w-4 h-4 inline mr-2" />
                        First Name
                      </label>
                      {editingPersonal ? (
                        <input
                          type="text"
                          name="first_name"
                          value={profile.first_name}
                          onChange={handleProfileChange}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 transition-all duration-200"
                          placeholder="Your first name"
                        />
                      ) : (
                        <p className="text-text-primary py-2">{profile.first_name || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        <User className="w-4 h-4 inline mr-2" />
                        Last Name
                      </label>
                      {editingPersonal ? (
                        <input
                          type="text"
                          name="last_name"
                          value={profile.last_name}
                          onChange={handleProfileChange}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 transition-all duration-200"
                          placeholder="Your last name"
                        />
                      ) : (
                        <p className="text-text-primary py-2">{profile.last_name || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <p className="text-text-primary py-2 break-all">{user?.email}</p>
                        <button
                          onClick={updateEmail}
                          className="text-gold hover:text-gold/80 text-sm transition-colors whitespace-nowrap"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      {editingPersonal ? (
                        <input
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleProfileChange}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 transition-all duration-200"
                          placeholder="(555) 123-4567"
                        />
                      ) : (
                        <p className="text-text-primary py-2">{profile.phone || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        <Building className="w-4 h-4 inline mr-2" />
                        Address
                      </label>
                      {editingPersonal ? (
                        <textarea
                          name="address"
                          value={profile.address}
                          onChange={handleProfileChange}
                          rows={3}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 resize-none transition-all duration-200"
                          placeholder="Your mailing address"
                        />
                      ) : (
                        <p className="text-text-primary py-2 whitespace-pre-line">{profile.address || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {/* Investment Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gold mb-4">Investment Profile</h3>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        IRA/401(k) Account Names
                      </label>
                      {editingPersonal ? (
                        <textarea
                          name="ira_accounts"
                          value={profile.ira_accounts}
                          onChange={handleProfileChange}
                          rows={3}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 resize-none transition-all duration-200"
                          placeholder="List your retirement account providers"
                        />
                      ) : (
                        <p className="text-text-primary py-2 whitespace-pre-line">{profile.ira_accounts || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        Investment Goals
                      </label>
                      {editingPersonal ? (
                        <textarea
                          name="investment_goals"
                          value={profile.investment_goals}
                          onChange={handleProfileChange}
                          rows={3}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 resize-none transition-all duration-200"
                          placeholder="Describe your investment objectives"
                        />
                      ) : (
                        <p className="text-text-primary py-2 whitespace-pre-line">{profile.investment_goals || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        Estimated Net Worth
                      </label>
                      {editingPersonal ? (
                        <select
                          name="net_worth"
                          value={profile.net_worth}
                          onChange={handleProfileChange}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 transition-all duration-200"
                        >
                          <option value="">Select range</option>
                          <option value="$500K - $1M">$500K - $1M</option>
                          <option value="$1M - $5M">$1M - $5M</option>
                          <option value="$5M - $10M">$5M - $10M</option>
                          <option value="$10M+">$10M+</option>
                        </select>
                      ) : (
                        <p className="text-text-primary py-2">{profile.net_worth || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm uppercase tracking-wide text-text-secondary">
                        Annual Income
                      </label>
                      {editingPersonal ? (
                        <select
                          name="annual_income"
                          value={profile.annual_income}
                          onChange={handleProfileChange}
                          className="w-full bg-white border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 transition-all duration-200"
                        >
                          <option value="">Select range</option>
                          <option value="$200K - $500K">$200K - $500K</option>
                          <option value="$500K - $1M">$500K - $1M</option>
                          <option value="$1M - $2M">$1M - $2M</option>
                          <option value="$2M+">$2M+</option>
                        </select>
                      ) : (
                        <p className="text-text-primary py-2">{profile.annual_income || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {editingPersonal && (
                  <div className="mt-6 md:mt-8 pt-6 border-t border-graphite">
                    <div className="flex flex-col md:flex-row gap-4 justify-end">
                      <button
                        onClick={() => setEditingPersonal(false)}
                        className="button-gold px-6 py-2 w-full md:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={loading}
                        className="button px-6 py-2 flex items-center justify-center gap-2 w-full md: w-auto"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <SuccessModal
              isOpen={showSuccessModal}
              onClose={() => setShowSuccessModal(false)}
              title="Profile Updated Successfully!"
              message="Your personal information has been saved and updated in your account."
            />

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
                        disabled={loading}
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
                        onClick={() => setEditingPassword(!editingPassword)}
                        className="button-gold px-4 py-2 w-full md:w-auto"
                      >
                        {editingPassword ? 'Cancel' : 'Change Password'}
                      </button>
                    </div>

                    {editingPassword ? (
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
                            disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="button px-6 py-2 flex items-center gap-2 w-full md:w-auto"
                          >
                            <Lock className="w-4 h-4" />
                            {loading ? 'Updating...' : 'Update Password'}
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

            {activeTab === 'documents' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-surface p-4 md:p-8 rounded-lg border border-graphite"
              >
                <h2 className="heading mb-6 md:mb-8">Available Documents</h2>
                <div className="space-y-4 md:space-y-6">
                  <div className="text-center py-8 md:py-12 text-text-secondary">
                    <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-graphite" />
                    <p className="mb-6">Access your investment documents</p>
                    <Link to="/investor-info" className="button">
                      View Available Documents
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Profile;