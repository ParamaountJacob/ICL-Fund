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
    Phone,
    Mail,
    Calendar,
    Shield,
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
    });
    const [loading, setLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

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

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
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
                    {/* Header */}
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
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="bg-gradient-to-br from-surface to-accent p-6 rounded-xl border border-graphite shadow-lg sticky top-8"
                            >
                                {/* Profile Header */}
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

                                {/* Navigation Menu */}
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

                                {/* Quick Contact */}
                                <div className="mt-8 pt-6 border-t border-graphite">
                                    <h4 className="text-sm font-semibold text-gold mb-3">Need Help?</h4>
                                    <button className="w-full bg-gold/10 text-gold p-3 rounded-lg hover:bg-gold/20 transition-all duration-300 text-sm font-medium">
                                        Schedule Consultation
                                    </button>
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
                                    <div className="space-y-8">
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
                                                        <span className="text-text-primary text-right">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
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

                                        {/* Quick Actions */}
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

                                {/* Edit Profile Tab */}
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

                                {/* Security Tab */}
                                {activeTab === 'security' && (
                                    <div className="space-y-8">
                                        {/* Account Security Section */}
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

                                        {/* Account Information */}
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

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                defaultTab="register"
            />
        </div>
    );
};

export default Profile;
