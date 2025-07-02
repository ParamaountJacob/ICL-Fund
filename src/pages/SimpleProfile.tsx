import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, MapPin, DollarSign, Target, Settings, LogOut, Lock, Edit } from 'lucide-react';

interface ProfileData {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    investment_goals: string;
    annual_income: string;
    net_worth: string;
    ira_accounts: string;
}

const SimpleProfile: React.FC = () => {
    const { user, profile, logout } = useAuth();
    const { success, error } = useNotifications();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [changePasswordMode, setChangePasswordMode] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [profileData, setProfileData] = useState<ProfileData>({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        investment_goals: profile?.investment_goals || '',
        annual_income: profile?.annual_income || '',
        net_worth: profile?.net_worth || '',
        ira_accounts: profile?.ira_accounts || ''
    });

    useEffect(() => {
        if (profile) {
            setProfileData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone: profile.phone || '',
                address: profile.address || '',
                investment_goals: profile.investment_goals || '',
                annual_income: profile.annual_income || '',
                net_worth: profile.net_worth || '',
                ira_accounts: profile.ira_accounts || ''
            });
        }
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    ...profileData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            success('Profile updated successfully!');
            setIsEditing(false);
        } catch (err: any) {
            error(`Error updating profile: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            success('Password updated successfully!');
            setChangePasswordMode(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            error(`Error updating password: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatIncomeDisplay = (value: string) => {
        switch (value) {
            case 'under_100k': return 'Under $100,000';
            case '100k_250k': return '$100,000 - $250,000';
            case '250k_500k': return '$250,000 - $500,000';
            case '500k_1m': return '$500,000 - $1,000,000';
            case 'over_1m': return 'Over $1,000,000';
            default: return 'Not specified';
        }
    };

    const formatNetWorthDisplay = (value: string) => {
        switch (value) {
            case 'under_500k': return 'Under $500,000';
            case '500k_1m': return '$500,000 - $1,000,000';
            case '1m_5m': return '$1,000,000 - $5,000,000';
            case '5m_10m': return '$5,000,000 - $10,000,000';
            case 'over_10m': return 'Over $10,000,000';
            default: return 'Not specified';
        }
    };

    return (
        <div className="pt-16 min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">My Profile</h1>
                    <p className="text-text-secondary">Manage your account settings and investment information</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Profile Overview Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface rounded-lg border border-graphite p-6 text-center">
                            <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-10 h-10 text-background" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary mb-2">
                                {profileData.first_name} {profileData.last_name}
                            </h2>
                            <p className="text-text-secondary mb-4">{user?.email}</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-background px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                                </button>

                                <button
                                    onClick={() => setChangePasswordMode(!changePasswordMode)}
                                    className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-graphite text-text-primary border border-graphite px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Lock className="w-4 h-4" />
                                    Change Password
                                </button>

                                <button
                                    onClick={logout}
                                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Change Password Section */}
                        {changePasswordMode && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface rounded-lg border border-graphite p-6"
                            >
                                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Change Password
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            placeholder="Enter new password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            placeholder="Confirm new password"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={loading || !newPassword || !confirmPassword}
                                            className="button px-4 py-2 disabled:opacity-50"
                                        >
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setChangePasswordMode(false);
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }}
                                            className="px-4 py-2 border border-graphite rounded-lg text-text-primary hover:bg-graphite transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Personal Information */}
                        <div className="bg-surface rounded-lg border border-graphite p-6">
                            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Personal Information
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        First Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={profileData.first_name}
                                            onChange={handleInputChange}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                        />
                                    ) : (
                                        <p className="text-text-primary py-3">{profileData.first_name || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Last Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={profileData.last_name}
                                            onChange={handleInputChange}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                        />
                                    ) : (
                                        <p className="text-text-primary py-3">{profileData.last_name || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Email
                                    </label>
                                    <p className="text-text-primary py-3">{user?.email}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Phone
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profileData.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                        />
                                    ) : (
                                        <p className="text-text-primary py-3">{profileData.phone || 'Not provided'}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Address
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="address"
                                            value={profileData.address}
                                            onChange={handleInputChange}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                        />
                                    ) : (
                                        <p className="text-text-primary py-3">{profileData.address || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="button px-4 py-2 disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 border border-graphite rounded-lg text-text-primary hover:bg-graphite transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Investment Information */}
                        <div className="bg-surface rounded-lg border border-graphite p-6">
                            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Investment Information
                            </h3>

                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Annual Income
                                        </label>
                                        {isEditing ? (
                                            <select
                                                name="annual_income"
                                                value={profileData.annual_income}
                                                onChange={handleInputChange}
                                                className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            >
                                                <option value="">Select income range</option>
                                                <option value="under_100k">Under $100,000</option>
                                                <option value="100k_250k">$100,000 - $250,000</option>
                                                <option value="250k_500k">$250,000 - $500,000</option>
                                                <option value="500k_1m">$500,000 - $1,000,000</option>
                                                <option value="over_1m">Over $1,000,000</option>
                                            </select>
                                        ) : (
                                            <p className="text-text-primary py-3">{formatIncomeDisplay(profileData.annual_income)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Net Worth
                                        </label>
                                        {isEditing ? (
                                            <select
                                                name="net_worth"
                                                value={profileData.net_worth}
                                                onChange={handleInputChange}
                                                className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            >
                                                <option value="">Select net worth range</option>
                                                <option value="under_500k">Under $500,000</option>
                                                <option value="500k_1m">$500,000 - $1,000,000</option>
                                                <option value="1m_5m">$1,000,000 - $5,000,000</option>
                                                <option value="5m_10m">$5,000,000 - $10,000,000</option>
                                                <option value="over_10m">Over $10,000,000</option>
                                            </select>
                                        ) : (
                                            <p className="text-text-primary py-3">{formatNetWorthDisplay(profileData.net_worth)}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Investment Goals
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            name="investment_goals"
                                            value={profileData.investment_goals}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none"
                                        />
                                    ) : (
                                        <p className="text-text-primary py-3">{profileData.investment_goals || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        IRA/Retirement Accounts
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            name="ira_accounts"
                                            value={profileData.ira_accounts}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full bg-background border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none"
                                        />
                                    ) : (
                                        <p className="text-text-primary py-3">{profileData.ira_accounts || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-surface rounded-lg border border-graphite p-6">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => window.location.href = '/start-investing'}
                                    className="button px-4 py-2"
                                >
                                    Update Investment Info
                                </button>
                                <button
                                    onClick={() => window.location.href = '/contact'}
                                    className="px-4 py-2 border border-graphite rounded-lg text-text-primary hover:bg-graphite transition-colors"
                                >
                                    Schedule Consultation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimpleProfile;
