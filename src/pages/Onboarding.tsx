import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase, createInvestmentApplicationWithDetails, getUserProfile, get_investment_application_by_id } from '../lib/supabase';
import { 
  ArrowRight, ArrowLeft, CheckCircle, DollarSign, FileText, CreditCard,
  User, Building, Info, Calculator, Percent, Calendar, Shield, Clock, 
  TrendingUp, X
} from 'lucide-react';
import { SuccessModal } from '../components/SuccessModal';

interface OnboardingData {
  investmentAmount: string;
  termYears: number;
  payoutFrequency: 'monthly' | 'quarterly' | 'annually';
  fundingSource: 'personal' | 'entity' | 'retirement' | 'not_sure';
  isRetirementSelfDirected: boolean | null;
  custodianName: string;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Investment Config, 2: Payout, 3: Funding, 4: Document Signing
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('500000');
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingData>({
    investmentAmount: '500000',
    termYears: 2,
    payoutFrequency: 'monthly',
    fundingSource: 'personal',
    isRetirementSelfDirected: null,
    custodianName: ''
  });

  useEffect(() => {
    // Check for application ID and step in URL
    const appId = searchParams.get('applicationId');
    const step = searchParams.get('step');
    
    if (appId) {
      setApplicationId(appId);
    }
    
    // Check if we need to restore state from help page navigation
    if (location.state?.restoreState) {
      const { currentStep: restoredStep, formData: restoredFormData, selectedTier: restoredTier } = location.state.restoreState;
      setCurrentStep(restoredStep);
      setFormData(restoredFormData);
      setSelectedTier(restoredTier);
      
      // Clear the state to prevent issues on refresh
      navigate('/onboarding', { replace: true });
    } else {
      // Ensure we start at the top for new visits
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/profile');
        return;
      }
      
      setUser(user);
      
      // If we have an application ID, fetch the application details
      if (appId) {
        // If step is specified, set the current step
        if (step === 'promissory_note') {
          navigate(`/promissory-note-flow?applicationId=${appId}`);
          return;
        }
        
        fetchApplicationDetails(appId);
      }
    });
  }, [navigate, location.state, searchParams]);

  const fetchApplicationDetails = async (appId: string) => {
    try {
      const application = await get_investment_application_by_id(appId);
      
      if (application) {
        // Set form data based on application
        setFormData({
          investmentAmount: application.investment_amount.toString(),
          termYears: Math.floor(application.term_months / 12),
          payoutFrequency: application.payment_frequency as any,
          fundingSource: 'personal', // Default
          isRetirementSelfDirected: null,
          custodianName: ''
        });
        
        // Set selected tier based on investment amount
        const amount = Number(application.investment_amount);
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
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const handleInputChange = (field: keyof OnboardingData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    return { monthlyReturn, quarterlyReturn, annualReturn, totalReturn, totalValue, rate };
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

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const investmentAmount = Number(formData.investmentAmount);
      const annualPercentage = getReturnRate(investmentAmount, formData.termYears);
      
      const newApplicationId = await createInvestmentApplicationWithDetails(
        investmentAmount,
        annualPercentage,
        formData.payoutFrequency,
        formData.termYears * 12
      );
      
      setApplicationId(newApplicationId);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.investmentAmount !== '' && Number(formData.investmentAmount) >= 200000 && formData.termYears > 0;
      case 2:
        return true; // Payout frequency is pre-selected
      case 3:
        if (formData.fundingSource === 'retirement' && formData.isRetirementSelfDirected === null) return false;
        if (formData.fundingSource === 'retirement' && formData.isRetirementSelfDirected === false) return false;
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (!user) {
    return null;
  }

  const returns = formData.investmentAmount ? calculateReturns(Number(formData.investmentAmount), formData.termYears) : null;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Investment Onboarding</h1>
          <p className="text-text-secondary mt-2">
            Configure your investment amount, terms, and projected returns
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="relative flex items-center justify-between w-full max-w-3xl">
            {/* Progress Bar */}
            <div className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-graphite w-full"></div>
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-gold transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
            
            {/* Step Circles */}
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-gold text-background' : 'bg-graphite text-text-secondary'
            }`}>
              {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : 1}
            </div>
            
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-gold text-background' : 'bg-graphite text-text-secondary'
            }`}>
              {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : 2}
            </div>
            
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-gold text-background' : 'bg-graphite text-text-secondary'
            }`}>
              {currentStep > 3 ? <CheckCircle className="w-5 h-5" /> : 3}
            </div>
            
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 4 ? 'bg-gold text-background' : 'bg-graphite text-text-secondary'
            }`}>
              4
            </div>
          </div>
        </div>
        
        {/* Step Labels */}
        <div className="flex justify-center mb-12">
          <div className="grid grid-cols-4 w-full max-w-3xl">
            <div className="text-center">
              <span className={`text-sm ${currentStep === 1 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                Investment Details
              </span>
            </div>
            <div className="text-center">
              <span className={`text-sm ${currentStep === 2 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                Payout Preferences
              </span>
            </div>
            <div className="text-center">
              <span className={`text-sm ${currentStep === 3 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                Funding Source
              </span>
            </div>
            <div className="text-center">
              <span className={`text-sm ${currentStep === 4 ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                Review & Submit
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-graphite rounded-lg shadow-lg p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-gold" />
                        Investment Details
                      </h3>
                      <div className="mb-8">
                        <label className="block text-sm font-medium text-text-secondary mb-3">Investment Term</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[1, 2].map((years) => (
                            <button 
                              key={years} 
                              onClick={() => handleInputChange('termYears', years)} 
                              className={`p-4 rounded-lg border-2 transition-all duration-200 font-medium ${
                                formData.termYears === years 
                                  ? 'border-gold bg-gold/10 text-gold' 
                                  : 'border-graphite bg-accent text-text-secondary hover:border-gold/50'
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
                        <label className="block text-sm font-medium text-text-secondary mb-3">Investment Tier</label>
                        <div className="space-y-3">
                          {['200000', '350000', '500000', '1000000'].map((amount) => {
                            const rate = getReturnRate(Number(amount), formData.termYears);
                            return (
                              <button 
                                key={amount} 
                                onClick={() => handleTierSelect(amount)} 
                                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                  selectedTier === amount 
                                    ? 'border-gold bg-gold/10' 
                                    : 'border-graphite bg-accent hover:border-gold/50'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-semibold text-text-primary">{getTierLabel(amount)}</div>
                                    <div className="text-sm text-text-secondary">Annual Return Rate</div>
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
                        <label className="block text-sm font-medium text-text-secondary mb-3">Exact Investment Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-lg">$</span>
                          <input 
                            type="number" 
                            value={formData.investmentAmount} 
                            onChange={(e) => {
                              const value = e.target.value;
                              handleInputChange('investmentAmount', value);
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
                            }} 
                            min="200000" 
                            step="1000" 
                            className="w-full bg-accent border border-graphite rounded-lg pl-10 pr-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary" 
                            placeholder="Minimum: $200,000"
                          />
                        </div>
                        <p className="text-xs text-text-secondary mt-2">Minimum investment: $200,000</p>
                      </div>
                    </div>
                  </div>
                  {returns && (
                    <div className="bg-accent rounded-xl p-4 md:p-6 mt-6 lg:mt-0 border border-graphite">
                      <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gold" />
                        Projected Returns
                      </h3>
                      <div className="space-y-6">
                        <div className="bg-surface border border-gold/20 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-sm text-text-secondary mb-1">Annual Return Rate</div>
                            <div className="text-2xl font-bold text-gold">{returns.rate}%</div>
                            {formData.termYears === 2 && (
                              <div className="text-xs text-text-secondary mt-1">Includes 2-year bonus</div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-graphite">
                            <span className="text-sm text-text-secondary">Monthly Income</span>
                            <span className="font-semibold text-text-primary">${Math.round(returns.monthlyReturn).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-graphite">
                            <span className="text-sm text-text-secondary">Annual Income</span>
                            <span className="font-semibold text-text-primary">${Math.round(returns.annualReturn).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-text-secondary">Total Return ({formData.termYears} year{formData.termYears > 1 ? 's' : ''})</span>
                            <span className="font-bold text-gold">${Math.round(returns.totalReturn).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-sm text-text-secondary mb-1">Final Investment Value</div>
                            <div className="text-xl font-bold text-text-primary">${Math.round(returns.totalValue).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  Payout Frequency
                </h3>
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {[
                    { key: 'monthly', label: 'Monthly', amount: returns?.monthlyReturn || 0, desc: 'Receive payments every month' },
                    { key: 'quarterly', label: 'Quarterly', amount: returns?.quarterlyReturn || 0, desc: 'Receive payments every 3 months' },
                    { key: 'annually', label: 'Annually', amount: returns?.annualReturn || 0, desc: 'Receive payments once per year' }
                  ].map((option) => (
                    <button 
                      key={option.key} 
                      onClick={() => handleInputChange('payoutFrequency', option.key as any)} 
                      className={`p-6 rounded-lg border-2 transition-all duration-200 text-center ${
                        formData.payoutFrequency === option.key 
                          ? 'border-gold bg-gold/10' 
                          : 'border-graphite bg-accent hover:border-gold/50'
                      }`}
                    >
                      <div className="mb-3">
                        <div className="font-semibold text-text-primary text-lg">{option.label}</div>
                        <div className="text-sm text-text-secondary">{option.desc}</div>
                      </div>
                      <div className="text-xl font-bold text-gold">${Math.round(option.amount).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
                <div className="bg-accent border border-graphite rounded-xl p-4 md:p-6">
                  <h4 className="font-semibold text-text-primary mb-4">Selected Payout Schedule</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-text-secondary mb-1">Frequency</div>
                      <div className="font-semibold text-text-primary capitalize">{formData.payoutFrequency}</div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary mb-1">Payment Amount</div>
                      <div className="font-bold text-gold text-lg">${Math.round(
                        formData.payoutFrequency === 'monthly' 
                          ? returns?.monthlyReturn || 0 
                          : formData.payoutFrequency === 'quarterly' 
                            ? returns?.quarterlyReturn || 0 
                            : returns?.annualReturn || 0
                      ).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold" />
                  Funding Source
                </h3>
                <div className="space-y-4 mb-8">
                  <button 
                    onClick={() => handleInputChange('fundingSource', 'personal')} 
                    className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                      formData.fundingSource === 'personal' 
                        ? 'border-gold bg-gold/10' 
                        : 'border-graphite bg-accent hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <User className="w-6 h-6 text-gold" />
                      <div>
                        <div className="font-semibold text-text-primary text-lg">Personal Funds</div>
                        <div className="text-text-secondary text-sm">Using personal savings, checking, or investment accounts</div>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleInputChange('fundingSource', 'entity')} 
                    className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                      formData.fundingSource === 'entity' 
                        ? 'border-gold bg-gold/10' 
                        : 'border-graphite bg-accent hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Building className="w-6 h-6 text-gold" />
                      <div>
                        <div className="font-semibold text-text-primary text-lg">Entity, Trust, or Family Office</div>
                        <div className="text-text-secondary text-sm">Funds from a legal entity, trust, or family office</div>
                      </div>
                    </div>
                  </button>
                  <div className="space-y-4">
                    <button 
                      onClick={() => handleInputChange('fundingSource', 'retirement')} 
                      className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.fundingSource === 'retirement' 
                          ? 'border-gold bg-gold/10' 
                          : 'border-graphite bg-accent hover:border-gold/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-6 h-6 text-gold" />
                        <div>
                          <div className="font-semibold text-text-primary text-lg">Retirement Account (IRA / 401k)</div>
                          <div className="text-text-secondary text-sm">Using retirement account funds from a custodian</div>
                        </div>
                      </div>
                    </button>
                    {formData.fundingSource === 'retirement' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        transition={{ duration: 0.3 }} 
                        className="bg-accent rounded-xl p-4 md:p-6 ml-0 md:ml-4 border-l-4 border-gold"
                      >
                        <h4 className="text-lg font-semibold text-text-primary mb-4">Is your retirement account self-directed?</h4>
                        <div className="space-y-3 mb-6">
                          <button 
                            onClick={() => handleInputChange('isRetirementSelfDirected', true)} 
                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                              formData.isRetirementSelfDirected === true 
                                ? 'border-green-500 bg-green-500/10' 
                                : 'border-graphite bg-surface hover:border-green-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-medium text-text-primary">Yes, it is self-directed</span>
                            </div>
                          </button>
                          <button 
                            onClick={() => navigate('/help/self-directed-ira', { state: { onboardingState: { currentStep, formData, selectedTier } } })} 
                            className="w-full p-4 rounded-lg border-2 border-red-500/50 bg-red-500/10 hover:border-red-500 transition-all duration-200 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <X className="w-5 h-5 text-red-500" />
                              <span className="font-medium text-text-primary">No, it is not self-directed</span>
                            </div>
                          </button>
                          <button 
                            onClick={() => navigate('/help/self-directed-ira', { state: { onboardingState: { currentStep, formData, selectedTier } } })} 
                            className="w-full p-4 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500 transition-all duration-200 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <Info className="w-5 h-5 text-yellow-500" />
                              <span className="font-medium text-text-primary">I'm not sure</span>
                            </div>
                          </button>
                        </div>
                        {formData.isRetirementSelfDirected === true && (
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-3">Who is your custodian? (optional)</label>
                            <input 
                              type="text" 
                              value={formData.custodianName} 
                              onChange={(e) => handleInputChange('custodianName', e.target.value)} 
                              className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary" 
                              placeholder="e.g. Equity Trust, Entrust Group, etc."
                            />
                          </div>
                        )}
                        {formData.isRetirementSelfDirected === false && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <X className="w-5 h-5 text-red-500 mt-0.5" />
                              <div>
                                <h5 className="font-semibold text-red-500 mb-2">Account Not Eligible</h5>
                                <p className="text-text-secondary text-sm mb-3">We can only accept self-directed accounts. Please consult your custodian or visit our help page to learn how to convert your account.</p>
                                <button 
                                  onClick={() => navigate('/help/self-directed-ira', { state: { onboardingState: { currentStep, formData, selectedTier } } })} 
                                  className="text-red-500 hover:text-red-400 font-medium text-sm underline"
                                >
                                  Learn more about self-directed accounts →
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" />
                  Review & Submit
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-accent rounded-lg p-6 border border-graphite">
                    <h4 className="font-semibold text-text-primary mb-4">Investment Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Investment Amount:</span>
                        <span className="text-text-primary font-medium">${Number(formData.investmentAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Investment Term:</span>
                        <span className="text-text-primary font-medium">{formData.termYears} Year{formData.termYears > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Annual Return Rate:</span>
                        <span className="text-gold font-medium">{returns?.rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Payout Frequency:</span>
                        <span className="text-text-primary font-medium capitalize">{formData.payoutFrequency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-accent rounded-lg p-6 border border-graphite">
                    <h4 className="font-semibold text-text-primary mb-4">Return Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Monthly Return:</span>
                        <span className="text-text-primary font-medium">${Math.round(returns?.monthlyReturn || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Annual Return:</span>
                        <span className="text-text-primary font-medium">${Math.round(returns?.annualReturn || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Total Return:</span>
                        <span className="text-gold font-medium">${Math.round(returns?.totalReturn || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Final Value:</span>
                        <span className="text-text-primary font-medium">${Math.round(returns?.totalValue || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent rounded-lg p-6 border border-graphite">
                  <h4 className="font-semibold text-text-primary mb-4">Funding Source</h4>
                  <div className="flex items-center gap-4">
                    {formData.fundingSource === 'personal' && <User className="w-5 h-5 text-gold" />}
                    {formData.fundingSource === 'entity' && <Building className="w-5 h-5 text-gold" />}
                    {formData.fundingSource === 'retirement' && <FileText className="w-5 h-5 text-gold" />}
                    <div>
                      <p className="text-text-primary font-medium">
                        {formData.fundingSource === 'personal' && 'Personal Funds'}
                        {formData.fundingSource === 'entity' && 'Entity, Trust, or Family Office'}
                        {formData.fundingSource === 'retirement' && 'Retirement Account (IRA / 401k)'}
                      </p>
                      {formData.fundingSource === 'retirement' && formData.isRetirementSelfDirected && (
                        <p className="text-text-secondary text-sm mt-1">
                          Self-directed account
                          {formData.custodianName && ` with ${formData.custodianName}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gold/10 border border-gold/20 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-gold mt-1" />
                    <div>
                      <h4 className="font-semibold text-gold mb-2">Next Steps</h4>
                      <p className="text-text-secondary text-sm">
                        After submitting your application, our team will review your information and contact you within 2-3 business days. 
                        Once approved, you'll receive a notification to sign your promissory note and complete the investment process.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-6 py-3 border border-graphite text-text-primary rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`ml-auto flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                  isStepValid()
                    ? 'bg-gold text-background hover:bg-gold/90'
                    : 'bg-graphite text-text-secondary cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !isStepValid()}
                className={`ml-auto flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                  isStepValid() && !loading
                    ? 'bg-gold text-background hover:bg-gold/90'
                    : 'bg-graphite text-text-secondary cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/dashboard');
          }}
          title="Investment Application Submitted"
          message="Your investment application has been submitted successfully. Our team will review your application and contact you within 2-3 business days to proceed with the next steps."
        />
      </div>
    </div>
  );
};

export default Onboarding;