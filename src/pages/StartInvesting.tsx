import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, DollarSign, User, Phone, Mail, Target, Home, FileText } from 'lucide-react';

interface InvestmentFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    countryCode: string;
    address: string;
    investment_amount: string;
    investment_goals: string;
    annual_income: string;
    net_worth: string;
    ira_accounts: string;
}

const StartInvesting: React.FC = () => {
    const { user, profile } = useAuth();
    const { success, error } = useNotifications();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<InvestmentFormData>({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: user?.email || '',
        phone: profile?.phone || '',
        countryCode: '+1',
        address: profile?.address || '',
        investment_amount: '',
        investment_goals: profile?.investment_goals || '',
        annual_income: profile?.annual_income || '',
        net_worth: profile?.net_worth || '',
        ira_accounts: profile?.ira_accounts || ''
    });

    // Auto-populate form from existing profile data
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone: profile.phone || '',
                address: profile.address || '',
                investment_goals: profile.investment_goals || '',
                annual_income: profile.annual_income || '',
                net_worth: profile.net_worth || '',
                ira_accounts: profile.ira_accounts || ''
            }));
        }
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
        }
    }, [profile, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Save to profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    address: formData.address,
                    investment_goals: formData.investment_goals,
                    annual_income: formData.annual_income,
                    net_worth: formData.net_worth,
                    ira_accounts: formData.ira_accounts,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            success('Investment information saved successfully!');
            setCurrentStep(4); // Go to final step
        } catch (err: any) {
            error(`Error saving information: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <User className="w-16 h-16 text-gold mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-text-primary mb-2">Personal Information</h2>
                <p className="text-text-secondary">Let's start with your basic details</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        First Name *
                    </label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        placeholder="Enter your first name"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        Last Name *
                    </label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        placeholder="Enter your last name"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                    Email Address *
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                    placeholder="your@email.com"
                />
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                    Phone Number *
                </label>
                <div className="flex gap-3">
                    <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        className="bg-surface border border-graphite rounded-lg px-3 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold w-32"
                    >
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+33">+33 (FR)</option>
                        <option value="+49">+49 (DE)</option>
                    </select>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="flex-1 bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        placeholder="(123) 456-7890"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                    Address *
                </label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                    placeholder="Your full address"
                />
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <DollarSign className="w-16 h-16 text-gold mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-text-primary mb-2">Investment Details</h2>
                <p className="text-text-secondary">Tell us about your investment goals</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        Investment Amount *
                    </label>
                    <select
                        name="investment_amount"
                        value={formData.investment_amount}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                    >
                        <option value="">Select investment range</option>
                        <option value="200000">$200,000 - $349,999</option>
                        <option value="350000">$350,000 - $499,999</option>
                        <option value="500000">$500,000 - $999,999</option>
                        <option value="1000000">$1,000,000+</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        Investment Goals
                    </label>
                    <textarea
                        name="investment_goals"
                        value={formData.investment_goals}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none"
                        placeholder="Describe your investment objectives and goals..."
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                            Annual Income
                        </label>
                        <select
                            name="annual_income"
                            value={formData.annual_income}
                            onChange={handleInputChange}
                            className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        >
                            <option value="">Select income range</option>
                            <option value="under_100k">Under $100,000</option>
                            <option value="100k_250k">$100,000 - $250,000</option>
                            <option value="250k_500k">$250,000 - $500,000</option>
                            <option value="500k_1m">$500,000 - $1,000,000</option>
                            <option value="over_1m">Over $1,000,000</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                            Net Worth
                        </label>
                        <select
                            name="net_worth"
                            value={formData.net_worth}
                            onChange={handleInputChange}
                            className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        >
                            <option value="">Select net worth range</option>
                            <option value="under_500k">Under $500,000</option>
                            <option value="500k_1m">$500,000 - $1,000,000</option>
                            <option value="1m_5m">$1,000,000 - $5,000,000</option>
                            <option value="5m_10m">$5,000,000 - $10,000,000</option>
                            <option value="over_10m">Over $10,000,000</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        IRA/Retirement Accounts
                    </label>
                    <textarea
                        name="ira_accounts"
                        value={formData.ira_accounts}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none"
                        placeholder="Describe your IRA or retirement account details..."
                    />
                </div>
            </div>
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <FileText className="w-16 h-16 text-gold mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-text-primary mb-2">Review & Submit</h2>
                <p className="text-text-secondary">Please review your information before submitting</p>
            </div>

            <div className="bg-surface rounded-lg p-6 border border-graphite">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-text-secondary">Name:</span> {formData.first_name} {formData.last_name}</div>
                    <div><span className="text-text-secondary">Email:</span> {formData.email}</div>
                    <div><span className="text-text-secondary">Phone:</span> {formData.countryCode} {formData.phone}</div>
                    <div><span className="text-text-secondary">Address:</span> {formData.address}</div>
                </div>
            </div>

            <div className="bg-surface rounded-lg p-6 border border-graphite">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Investment Information</h3>
                <div className="space-y-2 text-sm">
                    <div><span className="text-text-secondary">Investment Amount:</span> {formData.investment_amount ? `$${formData.investment_amount === '200000' ? '200K-349K' : formData.investment_amount === '350000' ? '350K-499K' : formData.investment_amount === '500000' ? '500K-999K' : '1M+'}` : 'Not specified'}</div>
                    <div><span className="text-text-secondary">Goals:</span> {formData.investment_goals || 'Not specified'}</div>
                    <div><span className="text-text-secondary">Annual Income:</span> {formData.annual_income || 'Not specified'}</div>
                    <div><span className="text-text-secondary">Net Worth:</span> {formData.net_worth || 'Not specified'}</div>
                </div>
            </div>
        </motion.div>
    );

    const renderStep4 = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
        >
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-background" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Ready to Sign Documents</h2>
            <p className="text-text-secondary max-w-md mx-auto">
                Your investment information has been saved. The next step would be document signing.
            </p>
            <div className="bg-surface rounded-lg p-6 border border-graphite">
                <p className="text-text-primary font-medium">Document Signing</p>
                <p className="text-text-secondary text-sm mt-2">
                    This feature is currently in development. Your information has been saved to your profile.
                </p>
            </div>
            <button
                onClick={() => window.location.href = '/profile'}
                className="button px-6 py-3"
            >
                Go to Profile
            </button>
        </motion.div>
    );

    const steps = [
        { title: 'Personal Info', icon: User },
        { title: 'Investment', icon: DollarSign },
        { title: 'Review', icon: FileText }
    ];

    return (
        <div className="pt-16 min-h-screen bg-background">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">Start Investing</h1>
                    <p className="text-text-secondary">Join our exclusive investment opportunities</p>
                </div>

                {currentStep <= 3 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-center space-x-4 mb-4">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const stepNumber = index + 1;
                                const isActive = stepNumber === currentStep;
                                const isCompleted = stepNumber < currentStep;

                                return (
                                    <div key={index} className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-gold text-background' :
                                                isCompleted ? 'bg-gold/20 text-gold' : 'bg-surface text-text-secondary'
                                            }`}>
                                            <StepIcon className="w-5 h-5" />
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-gold' : 'bg-graphite'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-center text-sm text-text-secondary">
                            Step {currentStep} of 3: {steps[currentStep - 1].title}
                        </p>
                    </div>
                )}

                <div className="bg-surface rounded-lg border border-graphite p-6 sm:p-8">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}

                    {currentStep <= 3 && (
                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${currentStep === 1
                                        ? 'text-text-secondary cursor-not-allowed'
                                        : 'text-text-primary hover:bg-graphite'
                                    }`}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 button px-6 py-2"
                                >
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 button px-6 py-2 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Submit'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StartInvesting;
