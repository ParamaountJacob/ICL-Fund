import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, update_application_onboarding_status, get_investment_application_by_id, createInvestmentApplicationWithDetails, getUserProfile, createDocumentSignature, createOrUpdateDocumentSignature } from '../../lib/supabase';
import { FileText, Loader2, FileSignature, CheckCircle, ArrowRight, ArrowLeft, User, Building, Info, Calculator, Percent, Calendar, Shield, Clock, Bone as Money, TrendingUp, X, CreditCard, HelpCircle, AlertCircle } from 'lucide-react';
import { SuccessModal } from '../../components/SuccessModal';
import SelfDirectedIRAModal from '../../components/SelfDirectedIRAModal';
import FundingSourcesModal from '../../components/FundingSourcesModal';

interface OnboardingData {
    investmentAmount: string;
    termYears: number;
    payoutFrequency: 'monthly' | 'quarterly' | 'annually';
    fundingSource: 'personal' | 'entity' | 'retirement' | 'not_sure';
    isRetirementSelfDirected: boolean | null;
    custodianName: string;
}

const SubscriptionAgreement: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation(); // Use the useLocation hook here
    const [loading, setLoading] = useState(false);
    const [creatingApplication, setCreatingApplication] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showSelfDirectedIRAModal, setShowSelfDirectedIRAModal] = useState(false);
    const [showSelfDirectedIRAHelp, setShowSelfDirectedIRAHelp] = useState(false);
    const [showFundingSourcesModal, setShowFundingSourcesModal] = useState(false);
    const [showFundingSourcesHelp, setShowFundingSourcesHelp] = useState(false);
    const [applicationId, setApplicationId] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState('500000');
    const [user, setUser] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(1); // 1: Investment Configuration, 2: Payout Frequency, 3: Funding Source, 4: Document Signing
    const [applicationDetails, setApplicationDetails] = useState<any>(null);
    const [formData, setFormData] = useState<OnboardingData>({
        investmentAmount: '500000',
        termYears: 2,
        payoutFrequency: 'monthly',
        fundingSource: 'personal',
        isRetirementSelfDirected: null,
        custodianName: ''
    });

    useEffect(() => {
        // Get application ID from URL parameters
        const appId = searchParams.get('applicationId');

        // Check if we need to restore state from help page navigation
        // Now 'location.state' will work correctly
        if (location.state?.restoreState) {
            const {
                applicationId: restoredAppId,
                currentStep: restoredStep,
                formData: restoredFormData
            } = location.state.restoreState;

            if (restoredAppId) {
                setApplicationId(restoredAppId);
            }

            if (restoredStep) {
                setCurrentStep(restoredStep);
            }

            if (restoredFormData) {
                setFormData(restoredFormData);

                // Update selected tier based on investment amount
                const amount = Number(restoredFormData.investmentAmount);
                if (amount >= 1000000) {
                    setSelectedTier('1000000');
                } else if (amount >= 500000) {
                    setSelectedTier('500000');
                } else if (amount >= 350000) {
                    setSelectedTier('350000');
                } else if (amount >= 200000) {
                    setSelectedTier('200000');
                }
            }

            // Clear the state to prevent issues on refresh
            navigate('/onboarding-flow/subscription-agreement', { replace: true });
        }

        // Check if user is authenticated
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                navigate('/profile');
                return;
            } else {
                setUser(user);

                // If we have an application ID, fetch the details
                if (appId) {
                    setApplicationId(appId);
                    fetchApplicationDetails(appId);
                } else {
                    // Fetch the active application for the current user
                    const fetchUserApplication = async () => {
                        const { data, error } = await supabase.rpc('get_user_active_application');
                        if (error) {
                            console.error('Error fetching user application:', error);
                            navigate('/dashboard');
                        } else if (data && data.length > 0) {
                            const userApp = data[0];
                            setApplicationId(userApp.id);
                            setApplicationDetails(userApp);
                        } else {
                            console.error('No active application found for the user.');
                            alert('No active application found. Please contact support.');
                            navigate('/dashboard');
                        }
                    };
                    fetchUserApplication();
                }
            }
        });
    }, [navigate, searchParams, location.state]);

    const fetchApplicationDetails = async (appId: string) => {
        try {
            const application = await get_investment_application_by_id(appId);
            if (application) {
                setApplicationDetails(application);
            } else {
                // No application found with this ID
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error fetching application details:', error);
            navigate('/dashboard');
        }
    };

    const handleInputChange = (field: keyof OnboardingData, value: string | boolean | null | number) => {
        setFormData(prev => {
            // If changing investment amount, update selected tier
            if (field === 'investmentAmount') {
                const amount = Number(value);
                if (amount >= 1000000) {
                    setSelectedTier('1000000');
                } else if (amount >= 500000) {
                    setSelectedTier('500000');
                } else if (amount >= 350000) {
                    setSelectedTier('350000');
                } else if (amount >= 200000) {
                    setSelectedTier('200000');
                }
            }
            return { ...prev, [field]: value };
        });
    };

    const handleTierSelect = (tierValue: string) => {
        setSelectedTier(tierValue);
        handleInputChange('investmentAmount', tierValue);
    };

    const getTierLabel = (value: string) => {
        switch (value) {
            case '200000': return '$200,000 - $349,999';
            case '350000': return '$350,000 - $499,999';
            case '500000': return '$500,000 - $999,999';
            case '1000000': return '$1,000,000+';
            default: return value;
        }
    };

    const getReturnRate = (amount: number, years: number) => {
        let baseRate;
        if (amount >= 1000000) baseRate = 14;
        else if (amount >= 500000) baseRate = 13;
        else if (amount >= 350000) baseRate = 12;
        else baseRate = 11;

        return years === 2 ? baseRate + 1 : baseRate;
    };

    const calculateReturns = (amount: number, years: number) => {
        const rate = getReturnRate(amount, years);
        const annualReturn = amount * rate / 100;
        const monthlyReturn = annualReturn / 12;
        const quarterlyReturn = annualReturn / 4;
        const totalReturn = annualReturn * years;
        const totalValue = amount + totalReturn;

        // Calculate number of payments based on frequency and term
        const monthlyPayments = years * 12; // 12 payments per year
        const quarterlyPayments = years * 4; // 4 payments per year
        const annualPayments = years; // 1 payment per year

        return {
            monthlyReturn,
            quarterlyReturn,
            annualReturn,
            totalReturn,
            totalValue,
            rate,
            monthlyPayments,
            quarterlyPayments,
            annualPayments
        };
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    };

    // Updated: handleUpdateApplication (was handleCreateApplication)
    const handleUpdateApplication = async () => {
        if (!user || !applicationId) {
            alert("Could not find an active application. Please refresh and try again.");
            return;
        }

        if (currentStep !== 2) {
            handleNext();
            return;
        }

        const userProfile = await getUserProfile();
        if (!userProfile?.first_name || !userProfile?.last_name) {
            alert('Please complete your profile with your first and last name before continuing.');
            navigate('/profile');
            return;
        }

        setCreatingApplication(true);
        try {
            const investmentAmount = Number(formData.investmentAmount);
            const annualPercentage = getReturnRate(investmentAmount, formData.termYears);

            const { error } = await supabase
                .from('investment_applications')
                .update({
                    investment_amount: investmentAmount,
                    annual_percentage: annualPercentage,
                    payment_frequency: formData.payoutFrequency,
                    term_months: formData.termYears * 12,
                    onboarding_status: 'profile_complete'
                })
                .eq('id', applicationId);

            if (error) throw error;

            handleNext();

        } catch (error) {
            console.error('Error updating application details:', error);
            alert('Failed to save your investment details. Please try again.');
        } finally {
            setCreatingApplication(false);
        }
    };

    // The NEW, CORRECT version
    const handleSignAgreement = async () => {
        if (!applicationId) {
            alert("Application ID not found. Please refresh.");
            return;
        }

        setLoading(true);
        try {
            // Use the client-side function that properly handles upserts
            await createOrUpdateDocumentSignature(
                applicationId,
                'subscription_agreement',
                'investor_signed',
                true, // sendAdminNotification
                true  // autoComplete
            );

            setShowSuccessModal(true);

        } catch (err) {
            console.error('Error signing agreement:', err);
            alert('There was an error signing the agreement. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1: // Investment configuration
                return formData.investmentAmount !== '' &&
                    Number(formData.investmentAmount) >= 200000 &&
                    formData.termYears > 0;
            case 2: // Payout frequency is always valid
                return true;
            case 3:
                if (formData.fundingSource === 'retirement') {
                    // User must make a selection to proceed
                    if (formData.isRetirementSelfDirected === null) return false;
                }
                return true;
            case 4:
                return true; // Document signing is the final action
            default:
                return false;
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    if (!user) {
        return (
            <div className="pt-20 min-h-screen bg-background">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-24 md:pt-12">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                    </div>
                </div>
            </div>
        );
    }

    const returns = formData.investmentAmount ? calculateReturns(Number(formData.investmentAmount), formData.termYears) : null;

    return (
        <div className="pt-20 min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-24 md:pt-12">
                <div className="text-center mb-8 md:mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-gold" />
                        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
                            {currentStep === 1 && 'Investment Configuration'}
                            {currentStep === 2 && 'Payout Preferences'}
                            {currentStep === 3 && 'Funding Source'}
                            {currentStep === 4 && 'Sign Agreement'}
                        </h1>
                    </div>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        {currentStep === 1 && 'Configure your investment amount, terms, and projected returns'}
                        {currentStep === 2 && 'Choose how frequently you want to receive your investment returns'}
                        {currentStep === 3 && 'Select the source of your investment funds'}
                        {currentStep === 4 && 'Sign your subscription agreement to continue the investment process'}
                    </p>

                    {/* Progress Indicator */}
                    <div className="flex justify-center mt-6">
                        <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-gold text-background' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : 1}
                            </div>
                            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-gold' : 'bg-gray-200'}`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-gold text-background' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : 2}
                            </div>
                            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-gold' : 'bg-gray-200'}`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-gold text-background' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {currentStep > 3 ? <CheckCircle className="w-4 h-4" /> : 3}
                            </div>
                            <div className={`w-16 h-1 ${currentStep >= 4 ? 'bg-gold' : 'bg-gray-200'}`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-gold text-background' : 'bg-gray-200 text-gray-500'
                                }`}>
                                4
                            </div>
                        </div>
                    </div>

                    {/* Step Labels */}
                    <div className="flex justify-center mt-4">
                        <div className="grid grid-cols-4 gap-4 w-full max-w-lg">
                            <div className="text-center">
                                <span className={`text-xs ${currentStep === 1 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                                    Investment Details
                                </span>
                            </div>
                            <div className="text-center">
                                <span className={`text-xs ${currentStep === 2 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                                    Payout Frequency
                                </span>
                            </div>
                            <div className="text-center">
                                <span className={`text-xs ${currentStep === 3 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                                    Funding Source
                                </span>
                            </div>
                            <div className="text-center">
                                <span className={`text-xs ${currentStep === 4 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                                    Sign Agreement
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Investment Configuration */}
                    {currentStep === 1 && !showSelfDirectedIRAHelp && !showFundingSourcesHelp && (
                        <motion.div
                            key="step1"
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                                <Calculator className="w-5 h-5 text-gold" />
                                                Investment Details
                                            </h3>
                                            <div className="mb-8">
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Investment Term</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[1, 2].map((years) => (
                                                        <button
                                                            key={years}
                                                            onClick={() => handleInputChange('termYears', years)}
                                                            className={`p-4 rounded-lg border-2 transition-all duration-200 font-medium ${formData.termYears === years
                                                                ? 'border-gold bg-gold/10 text-gold'
                                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gold/50'
                                                                }`}
                                                        >
                                                            <div className="text-center">
                                                                <div className="font-semibold">{years} Year{years > 1 ? 's' : ''}</div>
                                                                {years === 2 && (
                                                                    <div className="text-xs text-gold mt-1">+1% Rate Bonus</div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mb-8">
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Investment Tier</label>
                                                <div className="space-y-3">
                                                    {['200000', '350000', '500000', '1000000'].map((amount) => {
                                                        const rate = getReturnRate(Number(amount), formData.termYears);
                                                        return (
                                                            <button
                                                                key={amount}
                                                                onClick={() => handleTierSelect(amount)}
                                                                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${selectedTier === amount
                                                                    ? 'border-gold bg-gold/10'
                                                                    : 'border-gray-300 bg-white hover:border-gold/50'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <div className="font-semibold text-gray-900">{getTierLabel(amount)}</div>
                                                                        <div className="text-sm text-gray-600">Annual Return Rate</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xl font-bold text-gold">{rate}%</div>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Exact Investment Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                                                    <input
                                                        type="number"
                                                        value={formData.investmentAmount}
                                                        onChange={(e) => handleInputChange('investmentAmount', e.target.value)}
                                                        min="200000"
                                                        step="1000"
                                                        className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900"
                                                        placeholder="Minimum: $200,000"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Minimum investment: $200,000</p>
                                            </div>
                                        </div>
                                    </div>
                                    {returns && (
                                        <div className="bg-gray-50 rounded-xl p-4 md:p-6 mt-6 lg:mt-0">
                                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-gold" />
                                                Projected Returns
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="bg-white border border-gold/20 rounded-lg p-4">
                                                    <div className="text-center">
                                                        <div className="text-sm text-gray-600 mb-1">Annual Return Rate</div>
                                                        <div className="text-2xl font-bold text-gold">{returns.rate}%</div>
                                                        {formData.termYears === 2 && (
                                                            <div className="text-xs text-gray-500 mt-1">Includes 2-year bonus</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                        <span className="text-sm text-gray-600">Monthly Income</span>
                                                        <span className="font-semibold text-gray-900">${Math.round(returns.monthlyReturn).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                        <span className="text-sm text-gray-600">Annual Income</span>
                                                        <span className="font-semibold text-gray-900">${Math.round(returns.annualReturn).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2">
                                                        <span className="text-sm text-gray-600">Total Return ({formData.termYears} year{formData.termYears > 1 ? 's' : ''})</span>
                                                        <span className="font-bold text-gold">${Math.round(returns.totalReturn).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
                                                    <div className="text-center">
                                                        <div className="text-sm text-gray-600 mb-1">Final Investment Value</div>
                                                        <div className="text-xl font-bold text-gray-900">${Math.round(returns.totalValue).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Payout Frequency */}
                    {currentStep === 2 && !showSelfDirectedIRAHelp && !showFundingSourcesHelp && (
                        <motion.div
                            key="step2"
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                                <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-3 justify-center">
                                    <Calendar className="w-7 h-7 text-gold" />
                                    Choose Your Payout Frequency
                                </h3>

                                <div className="grid md:grid-cols-3 gap-6 mb-12">
                                    {[
                                        {
                                            key: 'monthly',
                                            label: 'Monthly',
                                            amount: returns?.monthlyReturn || 0,
                                            desc: 'Receive payments every month',
                                            payments: returns?.monthlyPayments || (formData.termYears * 12),
                                            icon: <Calendar className="w-8 h-8 text-gold" />
                                        },
                                        {
                                            key: 'quarterly',
                                            label: 'Quarterly',
                                            amount: returns?.quarterlyReturn || 0,
                                            desc: 'Receive payments every 3 months',
                                            payments: returns?.quarterlyPayments || (formData.termYears * 4),
                                            icon: <Calendar className="w-8 h-8 text-gold" />
                                        },
                                        {
                                            key: 'annually',
                                            label: 'Annually',
                                            amount: returns?.annualReturn || 0,
                                            desc: 'Receive payments once per year',
                                            payments: returns?.annualPayments || formData.termYears,
                                            icon: <Calendar className="w-8 h-8 text-gold" />
                                        }
                                    ].map((option) => (
                                        <motion.div
                                            key={option.key}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <button
                                                onClick={() => handleInputChange('payoutFrequency', option.key as any)}
                                                className={`w-full h-full p-8 rounded-xl border-2 transition-all duration-200 text-center ${formData.payoutFrequency === option.key
                                                    ? 'border-gold bg-gold/10 shadow-lg'
                                                    : 'border-gray-300 bg-white hover:border-gold/50 hover:shadow'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                                                        {option.icon}
                                                    </div>
                                                    <div className="font-semibold text-gray-900 text-xl mb-2">{option.label}</div>
                                                    <div className="text-sm text-gray-600 mb-6">{option.desc}</div>
                                                    <div className="text-3xl font-bold text-gold mb-2">${Math.round(option.amount).toLocaleString()}</div>
                                                    <div className="text-sm text-gray-600">per payment</div>
                                                    <div className="mt-4 pt-4 border-t border-gray-200 w-full">
                                                        <div className="text-sm text-gray-700">
                                                            {option.payments} payments over {formData.termYears} year{formData.termYears > 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                                            <Money className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Your Selected Payment Plan</h4>
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div>
                                                    <div className="text-sm text-gray-600 mb-1">Payment Frequency</div>
                                                    <div className="font-semibold text-gray-900 text-lg capitalize">{formData.payoutFrequency}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600 mb-1">Per Payment</div>
                                                    <div className="font-bold text-gold text-lg">
                                                        ${Math.round(
                                                            formData.payoutFrequency === 'monthly'
                                                                ? returns?.monthlyReturn || 0
                                                                : formData.payoutFrequency === 'quarterly'
                                                                    ? returns?.quarterlyReturn || 0
                                                                    : returns?.annualReturn || 0
                                                        ).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600 mb-1">Total Returns</div>
                                                    <div className="font-bold text-gray-900 text-lg">${Math.round(returns?.totalReturn || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Funding Source */}
                    {currentStep === 3 && !showSelfDirectedIRAHelp && !showFundingSourcesHelp && (
                        <motion.div
                            key="step3"
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-gold" />
                                    Select Your Funding Source
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <button
                                        onClick={() => handleInputChange('fundingSource', 'personal')}
                                        className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${formData.fundingSource === 'personal'
                                            ? 'border-gold bg-gold/10'
                                            : 'border-gray-300 bg-white hover:border-gold/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <User className="w-6 h-6 text-gold" />
                                            <div>
                                                <div className="font-semibold text-gray-900 text-lg">Personal Funds</div>
                                                <div className="text-gray-600 text-sm">Using personal savings, checking, or investment accounts</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleInputChange('fundingSource', 'entity')}
                                        className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${formData.fundingSource === 'entity'
                                            ? 'border-gold bg-gold/10'
                                            : 'border-gray-300 bg-white hover:border-gold/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Building className="w-6 h-6 text-gold" />
                                            <div>
                                                <div className="font-semibold text-gray-900 text-lg">Entity, Trust, or Family Office</div>
                                                <div className="text-gray-600 text-sm">Funds from a legal entity, trust, or family office</div>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="space-y-4">
                                        <button
                                            onClick={() => handleInputChange('fundingSource', 'retirement')}
                                            className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${formData.fundingSource === 'retirement'
                                                ? 'border-gold bg-gold/10'
                                                : 'border-gray-300 bg-white hover:border-gold/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <FileText className="w-6 h-6 text-gold" />
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-lg">Retirement Account (IRA / 401k)</div>
                                                    <div className="text-gray-600 text-sm">Using retirement account funds from a custodian</div>
                                                </div>
                                            </div>
                                        </button>

                                        {/* --- START: CORRECTED CODE BLOCK --- */}
                                        {formData.fundingSource === 'retirement' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-gray-50 rounded-xl p-4 md:p-6 ml-0 md:ml-4 border-l-4 border-gold"
                                            >
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Is your retirement account self-directed?</h4>
                                                <div className="space-y-3 mb-6">
                                                    {/* --- YES Button (Corrected Text Color) --- */}
                                                    <button
                                                        onClick={() => handleInputChange('isRetirementSelfDirected', true)}
                                                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${formData.isRetirementSelfDirected === true
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-300 bg-white hover:border-green-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                            <span className="font-medium text-gray-900">Yes, it is self-directed</span>
                                                        </div>
                                                    </button>

                                                    {/* --- NO Button (Corrected Logic and Styling) --- */}
                                                    <button
                                                        onClick={() => handleInputChange('isRetirementSelfDirected', false)}
                                                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${formData.isRetirementSelfDirected === false
                                                            ? 'border-red-500 bg-red-50'
                                                            : 'border-gray-300 bg-white hover:border-red-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <X className="w-5 h-5 text-red-600" />
                                                            <span className="font-medium text-gray-900">No, it is not self-directed</span>
                                                        </div>
                                                    </button>

                                                    {/* --- I'M NOT SURE Button (Corrected Text Color) --- */}
                                                    <button
                                                        onClick={() => setShowSelfDirectedIRAHelp(true)}
                                                        className="w-full p-4 rounded-lg border-2 border-yellow-300 bg-yellow-50 hover:border-yellow-400 transition-all duration-200 text-left"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Info className="w-5 h-5 text-yellow-600" />
                                                            <span className="font-medium text-gray-900">I'm not sure</span>
                                                        </div>
                                                    </button>
                                                </div>

                                                {formData.isRetirementSelfDirected === true && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">Who is your custodian? (optional)</label>
                                                        <input
                                                            type="text"
                                                            value={formData.custodianName}
                                                            onChange={(e) => handleInputChange('custodianName', e.target.value)}
                                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900"
                                                            placeholder="e.g. Equity Trust, Entrust Group, etc."
                                                        />
                                                    </div>
                                                )}

                                                {formData.isRetirementSelfDirected === false && (
                                                    <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-r-lg">
                                                        <div className="flex">
                                                            <div className="flex-shrink-0">
                                                                <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="text-sm">
                                                                    A self-directed account is required to invest with retirement funds. You can learn more by clicking the "I'm not sure" option.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                        {/* --- END: CORRECTED CODE BLOCK --- */}
                                    </div>
                                </div>

                                <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 md:p-6">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-gold mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-gold mb-2 flex items-center gap-2">
                                                Need More Information?
                                                <HelpCircle className="w-4 h-4 text-gold" />
                                            </h4>
                                            <p className="text-gray-700 text-sm mb-3">
                                                If you're unsure about your funding source options, you can learn more about each option.
                                            </p>
                                            <button
                                                onClick={() => setShowFundingSourcesHelp(true)}
                                                className="text-gold hover:text-gold/80 font-medium text-sm underline"
                                            >
                                                Learn more about funding sources →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Document Signing (Previously Step 5) */}
                    {currentStep === 4 && !showSelfDirectedIRAHelp && !showFundingSourcesHelp && (
                        <motion.div
                            key="step4"
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                                <div className="flex items-center justify-center mb-8">
                                    <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mr-4">
                                        <FileSignature className="w-8 h-8 text-gold" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-2xl font-semibold text-gray-900">Sign Subscription Agreement</h2>
                                        <p className="text-gray-600">
                                            Please sign your subscription agreement to continue
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center mb-8">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-700 mb-2">Subscription Agreement Signing Interface</p>
                                    <p className="text-gray-600 mt-2">
                                        When integrated with SignRequest, the document signing interface will appear here.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-center">
                                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                            <button
                                                onClick={handleSignAgreement}
                                                disabled={loading}
                                                className="button py-3 px-8 flex items-center justify-center gap-2 w-full"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <FileSignature className="w-5 h-5" />
                                                )}
                                                {loading ? 'Submitting...' : 'Sign Subscription Agreement'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Self-Directed IRA Help Section */}
                    {showSelfDirectedIRAHelp && (
                        <motion.div
                            key="self-directed-ira-help"
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-8"
                        >
                            <SelfDirectedIRAModal
                                isOpen={true}
                                onClose={() => setShowSelfDirectedIRAHelp(false)}
                            />
                        </motion.div>
                    )}

                    {/* Funding Sources Help Section */}
                    {showFundingSourcesHelp && (
                        <motion.div
                            key="funding-sources-help"
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-8"
                        >
                            <FundingSourcesModal
                                isOpen={true}
                                onClose={() => setShowFundingSourcesHelp(false)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className={`fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto bg-white md:bg-transparent border-t md:border-t-0 border-gray-200 p-4 md:p-0 md:mt-8 flex flex-row justify-between items-center gap-4 z-30 rounded-t-2xl md:rounded-none shadow-lg md:shadow-none ${showSelfDirectedIRAHelp || showFundingSourcesHelp ? 'hidden md:flex' : ''}`}>
                    {currentStep > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 bg-white"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                        </button>
                    )}

                    {currentStep === 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className={`ml-auto px-6 py-3 bg-gold text-background rounded-lg hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 font-semibold ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : currentStep === 2 ? (
                        <button
                            onClick={handleUpdateApplication}
                            disabled={creatingApplication || !isStepValid()}
                            className={`ml-auto px-6 py-3 bg-gold text-background rounded-lg hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 font-semibold ${!isStepValid() || creatingApplication ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {creatingApplication ? 'Saving...' : 'Continue'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : currentStep < 4 ? (
                        <button
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className={`ml-auto px-6 py-3 bg-gold text-background rounded-lg hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 font-semibold ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : null}
                </div>

                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigate('/dashboard');
                    }}
                    title="Subscription Agreement Signed"
                    message="Your subscription agreement has been signed successfully. Your application is now pending admin approval. You'll be notified when it's time to proceed with the next steps."
                />

                {/* Popup Modals for when we need them as actual modals */}
                {showSelfDirectedIRAModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-background max-w-4xl w-full rounded-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                            <SelfDirectedIRAModal
                                isOpen={true}
                                onClose={() => setShowSelfDirectedIRAModal(false)}
                            />
                        </div>
                    </div>
                )}

                {showFundingSourcesModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-background max-w-6xl w-full rounded-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                            <FundingSourcesModal
                                isOpen={true}
                                onClose={() => setShowFundingSourcesModal(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionAgreement;