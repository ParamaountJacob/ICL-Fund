import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import AuthModal from '../components/AuthModal';
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
            <div className="bg-gradient-to-r from-surface via-surface to-accent p-6 md:p-8 rounded-xl mb-6 md:mb-8 border border-graphite shadow-lg">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gold/20 to-gold/10 rounded-full flex items-center justify-center shadow-lg border border-gold/20">
                  <User className="w-10 h-10 md:w-12 md:h-12 text-gold" />
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-gold mb-2">My Profile</h1>
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-text-secondary text-sm md:text-base">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gold" />
                      <span className="break-all">{user?.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gold" />
                      <span>Member since January 15, 2024</span>
                    </div>
                    {(profile.first_name || profile.last_name) && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gold" />
                        <span>{profile.first_name} {profile.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8 md:mb-10">
              <div className="bg-gradient-to-r from-surface via-surface to-accent p-2 rounded-xl border border-graphite shadow-lg w-full max-w-lg">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm md:text-base ${activeTab === 'overview'
                      ? 'bg-gold text-background shadow-lg transform scale-105'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gold/10'
                      }`}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm md:text-base ${activeTab === 'personal'
                      ? 'bg-gold text-background shadow-lg transform scale-105'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gold/10'
                      }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    <span>Personal</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm md:text-base ${activeTab === 'security'
                      ? 'bg-gold text-background shadow-lg transform scale-105'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gold/10'
                      }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    <span>Security</span>
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
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signup"
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Profile;