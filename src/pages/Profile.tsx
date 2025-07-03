import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
import VerificationNotificationBell from '../components/VerificationNotificationBell';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import {
  User,
  Edit,
  Save,
  DollarSign,
  Target,
  TrendingUp,
  Settings,
  Lock,
  ChevronRight,
  FileText,
  Mail,
  Calendar,
  Phone,
  Building,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  FileCheck,
  Wallet,
  ArrowRight,
  MessageCircle,
  Clock
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
  verification_status?: 'pending' | 'verified' | 'denied';
  verification_requested?: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  net_worth: string;
  annual_income: string;
  investment_goals: string;
  verification_status?: 'pending' | 'verified' | 'denied';
  verification_requested?: boolean;
  created_at: string;
}

type DocumentType = 'pitch_deck' | 'ppm' | 'wire_instructions';

const Profile: React.FC = () => {
  const { user, profile: authProfile, loading, refreshProfile } = useAuth();
  const { success, error: showError } = useNotifications();
  const navigate = useNavigate();

  // Check if user is admin
  const isAdmin = user?.email === 'innercirclelending@gmail.com';

  const [profile, setProfile] = useState<UserProfile>({
    first_name: authProfile?.first_name || '',
    last_name: authProfile?.last_name || '',
    phone: authProfile?.phone || '',
    address: authProfile?.address || '',
    ira_accounts: authProfile?.ira_accounts || '',
    investment_goals: authProfile?.investment_goals || '',
    net_worth: authProfile?.net_worth || '',
    annual_income: authProfile?.annual_income || '',
    verification_status: authProfile?.verification_status || 'pending',
    verification_requested: authProfile?.verification_requested || false
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'security' | 'admin'>('overview');
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationFormData, setVerificationFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    net_worth: '',
    annual_income: '',
    investment_goals: ''
  });
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingInvestment, setIsEditingInvestment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
        annual_income: authProfile.annual_income || '',
        verification_status: authProfile.verification_status || 'pending',
        verification_requested: authProfile.verification_requested || false
      });
    }
    fetchDocumentAccess();
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [authProfile, isAdmin]);

  const syncUsersFromAuth = async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    try {
      console.log('Starting user sync from Auth to Profiles...');

      // Try to use the sync function first
      const { data, error } = await supabase.rpc('sync_auth_users_to_profiles');

      if (error) {
        console.log('RPC function error:', error);
        console.log('Function may not exist or database not properly configured.');
        showError(`Sync function error: ${error.message}. Please ensure the database migration has been run.`);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        console.log('Sync result:', result);
        success(`${result.message || 'Users synced successfully!'}`);
      } else {
        success('Sync function executed successfully!');
      }

      // Refresh the user list
      await fetchAllUsers();

    } catch (error: any) {
      console.error('Error syncing users:', error);
      showError(`Failed to sync users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (!isAdmin) return;

    try {
      console.log('Fetching users as admin...');

      // First try with verification columns
      let { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          net_worth,
          annual_income,
          investment_goals,
          verification_status,
          verification_requested,
          created_at
        `)
        .order('created_at', { ascending: false });

      console.log('Profiles query result:', { data, error });

      // If verification columns don't exist, fetch without them
      if (error && error.code === '42703') {
        console.log('Verification columns not found, trying without them...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            first_name,
            last_name,
            phone,
            net_worth,
            annual_income,
            investment_goals,
            created_at
          `)
          .order('created_at', { ascending: false });

        console.log('Fallback profiles query result:', { fallbackData, fallbackError });

        if (fallbackError) {
          if (fallbackError.code === '42P01') {
            console.log('Profiles table does not exist');
            showError('Profiles table not found. Please run the database migration first.');
            return;
          }
          throw fallbackError;
        }

        // Add default verification values
        const usersWithDefaults = (fallbackData || []).map(user => ({
          ...user,
          verification_status: 'pending' as const,
          verification_requested: false
        }));

        console.log('Setting users from fallback data:', usersWithDefaults);
        setAllUsers(usersWithDefaults);

        if (usersWithDefaults.length === 0) {
          showError('No users found in profiles table. Click "Sync Users from Auth" to sync users from the authentication system.');
        }
        return;
      }

      if (error) {
        console.error('Error fetching users:', error);
        if (error.code === '42P01') {
          showError('Database not yet configured. Please run the database migration first.');
          return;
        }
        throw error;
      }

      console.log('Setting users from main query:', data);
      setAllUsers(data || []);

      if (!data || data.length === 0) {
        showError('No users found in profiles table. Click "Sync Users from Auth" to sync users from the authentication system.');
      }

    } catch (error: any) {
      console.error('Error in fetchAllUsers:', error);
      logger.error('Error fetching users:', error);
      showError('Failed to fetch users: ' + error.message);
    }
  };

  const requestVerification = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Try to update with verification_requested column
      let { error } = await supabase
        .from('profiles')
        .update({
          verification_requested: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // If verification columns don't exist, show a message
      if (error && error.code === '42703') {
        showError('Verification system not yet configured. Please contact support.');
        return;
      }

      if (error) throw error;

      await refreshProfile();
      success('Verification request sent successfully!');
    } catch (error: any) {
      showError('Failed to request verification: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitVerificationRequest = async () => {
    if (!user) return;

    // Validate required fields
    if (!verificationFormData.first_name || !verificationFormData.last_name || !verificationFormData.phone ||
      !verificationFormData.net_worth || !verificationFormData.annual_income || !verificationFormData.investment_goals) {
      showError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      // Update profile with verification data and request verification
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: verificationFormData.first_name,
          last_name: verificationFormData.last_name,
          phone: verificationFormData.phone,
          net_worth: verificationFormData.net_worth,
          annual_income: verificationFormData.annual_income,
          investment_goals: verificationFormData.investment_goals,
          verification_requested: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Try to create notifications (will fail silently if table doesn't exist yet)
      try {
        // Create notification for user
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_title: 'Verification Request Submitted',
          p_message: 'Your verification request has been submitted and is being reviewed by our team.',
          p_type: 'info',
          p_action_type: 'verification_submitted'
        });

        // Create notification for admin
        await supabase.rpc('create_admin_verification_notification', {
          p_requesting_user_id: user.id,
          p_requesting_user_email: user.email || 'Unknown'
        });
      } catch (notificationError) {
        console.log('Notifications not yet configured:', notificationError);
      }

      await refreshProfile();
      setShowVerificationForm(false);
      setVerificationFormData({
        first_name: '',
        last_name: '',
        phone: '',
        net_worth: '',
        annual_income: '',
        investment_goals: ''
      });
      success('Verification request submitted successfully! An admin will review your information.');
    } catch (error: any) {
      showError('Failed to submit verification request: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          verification_requested: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Try to create notification for the user (will fail silently if table doesn't exist)
      try {
        await supabase.rpc('notify_verification_status_change', {
          p_user_id: userId,
          p_status: 'verified'
        });
      } catch (notificationError) {
        console.log('Notifications not yet configured:', notificationError);
      }

      await loadUsers();
      success('User verified successfully!');
    } catch (error: any) {
      showError('Failed to verify user: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectVerification = async (userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'denied',
          verification_requested: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Try to create notification for the user (will fail silently if table doesn't exist)
      try {
        await supabase.rpc('notify_verification_status_change', {
          p_user_id: userId,
          p_status: 'denied'
        });
      } catch (notificationError) {
        console.log('Notifications not yet configured:', notificationError);
      }

      await loadUsers();
      success('Verification request rejected.');
    } catch (error: any) {
      showError('Failed to reject verification: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for when admin clicks on a verification notification
  const handleAdminNotificationClick = (userId: string) => {
    if (isAdmin) {
      setActiveTab('admin');
      // Find the user and set them as selected
      const targetUser = allUsers.find(u => u.id === userId);
      if (targetUser) {
        setSelectedUser(targetUser);
      }
    }
  };

  const updateUserVerification = async (userId: string, status: 'verified' | 'denied') => {
    if (!isAdmin) return;

    setIsLoading(true);
    try {
      // Try to update with verification columns
      let { error } = await supabase
        .from('profiles')
        .update({
          verification_status: status,
          verification_requested: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // If verification columns don't exist, show a message
      if (error && error.code === '42703') {
        showError('Verification system not yet configured. Database migration needed.');
        return;
      }

      if (error) throw error;

      await fetchAllUsers();
      success(`User ${status} successfully!`);
      setSelectedUser(null);
    } catch (error: any) {
      showError('Failed to update verification: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userId: string, updatedData: Partial<AdminUser>) => {
    if (!isAdmin) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: updatedData.first_name,
          last_name: updatedData.last_name,
          phone: updatedData.phone,
          net_worth: updatedData.net_worth,
          annual_income: updatedData.annual_income,
          investment_goals: updatedData.investment_goals,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await fetchAllUsers();
      success('User profile updated successfully!');
      setEditingUser(null);
      setSelectedUser(null);
    } catch (error: any) {
      showError('Failed to update user profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
  };

  const saveProfile = async () => {
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
                className="button"
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
      <section className="relative bg-gradient-to-r from-surface via-accent to-surface border-b border-graphite pt-20 md:pt-28">
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

      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile-First Profile Header */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-2xl border border-graphite shadow-xl">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gold to-gold/80 rounded-full flex items-center justify-center shadow-lg ring-4 ring-gold/20">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-background" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-3 border-surface flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-text-primary truncate">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : 'Investment Profile'
                    }
                  </h3>
                  <p className="text-text-secondary text-sm truncate">{user?.email}</p>
                  {!isAdmin && (
                    <button
                      onClick={requestVerification}
                      disabled={isLoading || profile.verification_requested}
                      className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors duration-200 disabled:opacity-50"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {profile.verification_status === 'verified' ? 'Verified' :
                        profile.verification_requested ? 'Verification Pending' : 'Request Verification'}
                    </button>
                  )}
                  {isAdmin && (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                      <Settings className="w-3 h-3 mr-1" />
                      Admin Account
                    </div>
                  )}
                </div>

                {/* Notification Bell */}
                <div className="flex-shrink-0">
                  <VerificationNotificationBell
                    onAdminNotificationClick={handleAdminNotificationClick}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-First Navigation Tabs */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-surface to-accent p-2 rounded-2xl border border-graphite shadow-lg">
              <div className={`grid gap-1 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {[
                  { id: 'overview', label: 'Overview', icon: TrendingUp },
                  { id: 'personal', label: 'Personal', icon: User },
                  { id: 'security', label: 'Security', icon: Shield },
                  ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : [])
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                        ? 'bg-gold text-background shadow-lg'
                        : 'text-text-secondary hover:bg-gold/10 hover:text-gold'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Account Summary */}
                  <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gold" />
                      </div>
                      <h3 className="text-lg font-semibold text-gold">Account Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                        <span className="text-text-secondary font-medium text-sm">Email</span>
                        <span className="text-text-primary text-right text-sm break-words max-w-[70%] leading-tight">{user?.email || 'No email provided'}</span>
                      </div>
                      <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                        <span className="text-text-secondary font-medium text-sm">Name</span>
                        <span className="text-text-primary text-right text-sm">{profile.first_name} {profile.last_name}</span>
                      </div>
                      <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                        <span className="text-text-secondary font-medium text-sm">Phone</span>
                        <span className="text-text-primary text-right text-sm">{profile.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                        <span className="text-text-secondary font-medium text-sm">Member Since</span>
                        <span className="text-text-primary text-right text-sm">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Investment Profile */}
                  <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-gold" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gold">Investment Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-accent rounded-lg border border-gold/20">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-gold" />
                          <span className="text-text-secondary font-medium text-xs sm:text-sm">Net Worth</span>
                        </div>
                        <span className="text-text-primary text-xs sm:text-sm font-semibold">
                          {profile.net_worth || 'Not provided'}
                        </span>
                      </div>
                      <div className="p-3 bg-accent rounded-lg border border-gold/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-gold" />
                          <span className="text-text-secondary font-medium text-xs sm:text-sm">Annual Income</span>
                        </div>
                        <span className="text-text-primary text-xs sm:text-sm font-semibold">
                          {profile.annual_income || 'Not provided'}
                        </span>
                      </div>
                      <div className="p-3 bg-accent rounded-lg border border-gold/20 sm:col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-gold" />
                          <span className="text-text-secondary font-medium text-xs sm:text-sm">Investment Goals</span>
                        </div>
                        <span className="text-text-primary text-xs sm:text-sm leading-relaxed">
                          {profile.investment_goals || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <Settings className="w-4 h-4 text-gold" />
                      </div>
                      <h3 className="text-lg font-semibold text-gold">Quick Actions</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleStartInvesting}
                        className="w-full text-left p-4 bg-gradient-to-r from-gold/20 to-gold/10 border-2 border-gold/30 rounded-lg hover:bg-gold/30 hover:border-gold/50 transition-all duration-300 flex items-center gap-3"
                      >
                        <TrendingUp className="w-5 h-5 text-gold flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gold text-sm">Start Investing</div>
                          <div className="text-xs text-text-secondary">Begin your journey</div>
                        </div>
                      </button>
                      {profile && profile.verification_status !== 'verified' && !profile.verification_requested && (
                        <button
                          onClick={() => setShowVerificationForm(true)}
                          className="w-full text-left p-4 bg-gradient-to-r from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30 rounded-lg hover:bg-blue-500/30 hover:border-blue-500/50 transition-all duration-300 flex items-center gap-3"
                        >
                          <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-blue-500 text-sm">Get Verified</div>
                            <div className="text-xs text-text-secondary">Complete verification</div>
                          </div>
                        </button>
                      )}
                      {profile && profile.verification_requested && profile.verification_status !== 'verified' && (
                        <div className="w-full text-left p-4 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/30 rounded-lg flex items-center gap-3">
                          <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-yellow-500 text-sm">Verification Pending</div>
                            <div className="text-xs text-text-secondary">Admin review in progress</div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleScheduleConsultation}
                        className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
                      >
                        <MessageCircle className="w-5 h-5 text-gold flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm">Schedule Call</div>
                          <div className="text-xs text-text-secondary">Talk to advisor</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('personal')}
                        className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
                      >
                        <Edit className="w-5 h-5 text-gold flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm">Edit Profile</div>
                          <div className="text-xs text-text-secondary">Update details</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('security')}
                        className="w-full text-left p-4 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-300 flex items-center gap-3 border border-transparent"
                      >
                        <Lock className="w-5 h-5 text-gold flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm">Security</div>
                          <div className="text-xs text-text-secondary">Manage security</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Form Modal */}
              {showVerificationForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-500">Account Verification Request</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={verificationFormData.first_name}
                          onChange={(e) => setVerificationFormData(prev => ({
                            ...prev,
                            first_name: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary"
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={verificationFormData.last_name}
                          onChange={(e) => setVerificationFormData(prev => ({
                            ...prev,
                            last_name: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary"
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={verificationFormData.phone}
                          onChange={(e) => setVerificationFormData(prev => ({
                            ...prev,
                            phone: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary"
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Net Worth <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={verificationFormData.net_worth}
                          onChange={(e) => setVerificationFormData(prev => ({
                            ...prev,
                            net_worth: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary"
                          required
                        >
                          <option value="">Select net worth range</option>
                          <option value="$0 - $100k">$0 - $100k</option>
                          <option value="$100k - $500k">$100k - $500k</option>
                          <option value="$500k - $1M">$500k - $1M</option>
                          <option value="$1M - $5M">$1M - $5M</option>
                          <option value="$5M+">$5M+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Annual Income <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={verificationFormData.annual_income}
                          onChange={(e) => setVerificationFormData(prev => ({
                            ...prev,
                            annual_income: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary"
                          required
                        >
                          <option value="">Select income range</option>
                          <option value="$0 - $50k">$0 - $50k</option>
                          <option value="$50k - $100k">$50k - $100k</option>
                          <option value="$100k - $200k">$100k - $200k</option>
                          <option value="$200k - $500k">$200k - $500k</option>
                          <option value="$500k+">$500k+</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Investment Goals <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={verificationFormData.investment_goals}
                          onChange={(e) => setVerificationFormData(prev => ({
                            ...prev,
                            investment_goals: e.target.value
                          }))}
                          rows={4}
                          className="w-full px-3 py-2 bg-accent border border-graphite rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary resize-none"
                          placeholder="Tell us about your investment goals, experience, and what you hope to achieve..."
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={submitVerificationRequest}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Submit Request
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowVerificationForm(false)}
                        className="flex-1 bg-graphite hover:bg-graphite/80 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Personal Tab */}
              {activeTab === 'personal' && (
                <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                      <Edit className="w-4 h-4 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-gold">Edit Profile</h3>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }} className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-text-secondary font-medium mb-2 text-sm">First Name</label>
                          <input
                            type="text"
                            value={profile.first_name || ''}
                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-text-secondary font-medium mb-2 text-sm">Last Name</label>
                          <input
                            type="text"
                            value={profile.last_name || ''}
                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-text-secondary font-medium mb-2 text-sm">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-text-secondary font-medium mb-2 text-sm">Net Worth</label>
                          <input
                            type="text"
                            value={profile.net_worth || ''}
                            onChange={(e) => setProfile({ ...profile, net_worth: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your net worth"
                          />
                        </div>
                        <div>
                          <label className="block text-text-secondary font-medium mb-2 text-sm">Annual Income</label>
                          <input
                            type="text"
                            value={profile.annual_income || ''}
                            onChange={(e) => setProfile({ ...profile, annual_income: e.target.value })}
                            className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            placeholder="Enter your annual income"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-text-secondary font-medium mb-2 text-sm">Investment Goals</label>
                        <textarea
                          value={profile.investment_goals || ''}
                          onChange={(e) => setProfile({ ...profile, investment_goals: e.target.value })}
                          className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200 resize-none"
                          rows={4}
                          placeholder="Describe your investment goals and objectives"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-graphite">
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full sm:w-auto sm:ml-auto sm:flex px-6 py-3 bg-gradient-to-r from-gold to-gold/80 text-dark font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
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

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gold" />
                      </div>
                      <h3 className="text-lg font-semibold text-gold">Account Security</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-accent rounded-lg border border-graphite">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-text-primary">Change Password</h4>
                            <p className="text-text-secondary text-sm">Update your account password</p>
                          </div>
                          <button
                            onClick={updatePassword}
                            className="w-full sm:w-auto bg-gold text-background px-4 py-2 rounded-lg font-medium hover:bg-gold/90 transition-all duration-300 text-sm"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-accent rounded-lg border border-graphite">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-text-primary">Two-Factor Authentication</h4>
                            <p className="text-text-secondary text-sm">Add an extra layer of security</p>
                          </div>
                          <button className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-300 text-sm">
                            Enable 2FA
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-accent rounded-lg border border-graphite">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-text-primary">Update Email</h4>
                            <p className="text-text-secondary text-sm">Change your account email address</p>
                          </div>
                          <button
                            onClick={updateEmail}
                            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 text-sm"
                          >
                            Update Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gold" />
                      </div>
                      <h3 className="text-lg font-semibold text-gold">Account Information</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                        <span className="text-text-secondary text-sm">Account Created:</span>
                        <span className="text-text-primary text-sm text-right">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                        <span className="text-text-secondary text-sm">Last Sign In:</span>
                        <span className="text-text-primary text-sm text-right">{user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-start p-3 bg-accent rounded-lg">
                        <span className="text-text-secondary text-sm">Email Confirmed:</span>
                        <span className="text-text-primary text-sm text-right">{user?.email_confirmed_at ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Tab */}
              {activeTab === 'admin' && isAdmin && (
                <div className="space-y-4 sm:space-y-6">
                  {!selectedUser && !editingUser && (
                    <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                          <Settings className="w-4 h-4 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-red-500">User Management</h3>
                        <button
                          onClick={syncUsersFromAuth}
                          disabled={isLoading}
                          className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Syncing...' : 'Sync Users from Auth'}
                        </button>
                      </div>

                      <div className="space-y-3">
                        {allUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className="p-3 bg-accent rounded-lg hover:bg-gold/20 hover:border-gold/30 transition-all duration-200 cursor-pointer border border-transparent"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="font-medium text-text-primary">
                                  {user.first_name} {user.last_name}
                                  {!user.first_name && !user.last_name && 'Unnamed User'}
                                </div>
                                <div className="text-sm text-text-secondary">{user.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded-full ${user.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                                      user.verification_requested ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {user.verification_status === 'verified' ? 'Verified' :
                                      user.verification_requested ? 'Verification Requested' : 'Not Verified'}
                                  </span>
                                  {user.verification_requested && user.verification_status !== 'verified' && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVerifyUser(user.id);
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs rounded transition-colors"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRejectVerification(user.id);
                                        }}
                                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded transition-colors"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-text-secondary" />
                            </div>
                          </div>
                        ))}
                        {allUsers.length === 0 && (
                          <div className="text-center text-text-secondary py-8">
                            No users found.
                          </div>
                        )}
                      </div>

                      {/* Quick Verification Section */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
                        <h4 className="font-medium text-blue-500 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Quick Verification Actions
                        </h4>
                        <p className="text-sm text-text-secondary mb-3">
                          Click on any user above to view their profile and manage verification status.
                          Users with pending verification requests have approve/reject buttons available.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-text-secondary">Verified Users</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-text-secondary">Pending Verification</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            <span className="text-text-secondary">Not Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedUser && !editingUser && (
                    <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gold">Managing User: {selectedUser.first_name} {selectedUser.last_name}</h3>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="text-text-secondary hover:text-text-primary"
                        >
                          ← Back to List
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-accent rounded-lg">
                            <div className="text-sm text-text-secondary">Email</div>
                            <div className="font-medium">{selectedUser.email}</div>
                          </div>
                          <div className="p-3 bg-accent rounded-lg">
                            <div className="text-sm text-text-secondary">Status</div>
                            <div className={`font-medium ${(selectedUser.verification_status || 'pending') === 'verified' ? 'text-green-600' :
                              (selectedUser.verification_status || 'pending') === 'denied' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                              {(selectedUser.verification_status || 'pending') === 'verified' ? 'Verified' :
                                (selectedUser.verification_status || 'pending') === 'denied' ? 'Denied' :
                                  (selectedUser.verification_requested || false) ? 'Verification Requested' : 'Not Verified'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => setEditingUser(selectedUser)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit Profile
                          </button>

                          {(selectedUser.verification_requested || false) && (selectedUser.verification_status || 'pending') !== 'verified' && (
                            <>
                              <button
                                onClick={() => updateUserVerification(selectedUser.id, 'verified')}
                                disabled={isLoading}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                              >
                                {isLoading ? 'Processing...' : 'Approve Verification'}
                              </button>
                              <button
                                onClick={() => updateUserVerification(selectedUser.id, 'denied')}
                                disabled={isLoading}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                              >
                                {isLoading ? 'Processing...' : 'Deny Verification'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {editingUser && (
                    <div className="bg-gradient-to-br from-surface to-accent p-4 sm:p-6 rounded-xl border border-graphite shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gold">Edit User Profile</h3>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-text-secondary hover:text-text-primary"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        updateUserProfile(editingUser.id, editingUser);
                      }} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-text-secondary font-medium mb-2 text-sm">First Name</label>
                            <input
                              type="text"
                              value={editingUser.first_name || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                              className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-text-secondary font-medium mb-2 text-sm">Last Name</label>
                            <input
                              type="text"
                              value={editingUser.last_name || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                              className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-text-secondary font-medium mb-2 text-sm">Phone</label>
                            <input
                              type="tel"
                              value={editingUser.phone || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                              className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-text-secondary font-medium mb-2 text-sm">Net Worth</label>
                            <input
                              type="text"
                              value={editingUser.net_worth || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, net_worth: e.target.value })}
                              className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-text-secondary font-medium mb-2 text-sm">Annual Income</label>
                            <input
                              type="text"
                              value={editingUser.annual_income || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, annual_income: e.target.value })}
                              className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-text-secondary font-medium mb-2 text-sm">Investment Goals</label>
                            <textarea
                              value={editingUser.investment_goals || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, investment_goals: e.target.value })}
                              className="w-full p-3 bg-accent border border-graphite rounded-lg text-text-primary focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200 resize-none"
                              rows={3}
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gold text-background px-6 py-2 rounded-lg font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Profile;