import React, { useState } from 'react';
import { Video, Phone, DollarSign, Calendar, Clock, User, Mail, MessageSquare, ArrowRight, CheckCircle, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, crmService, profileService } from '../lib';
import { createLeadFromConsultation } from '../lib/crm';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import SuccessModal from './SuccessModal';

interface ConsultationFormProps {
  onSuccess?: () => void;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consultationType, setConsultationType] = useState<'video' | 'phone'>('video');
  const [currentStep, setCurrentStep] = useState(1); // Start at step 1 (personal info)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    has_retirement_accounts: '',
    retirement_account_details: '',
    investment_goals: '',
    suggested_investment_amount: '',
    notes: ''
  });

  React.useEffect(() => {
    // Get current user and profile data
    const loadUserData = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          setFormData(prev => ({
            ...prev,
            email: currentUser.email || ''
          }));

          // Fetch existing profile data
          const profile = await profileService.getUserProfile(currentUser.id);
          if (profile) {
            setFormData(prev => ({
              ...prev,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              phone: profile.phone || '',
              address: profile.address || '',
              retirement_account_details: profile.ira_accounts || '',
              investment_goals: profile.investment_goals || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert('Please select both a date and time for your consultation.');
      return;
    }

    // Force phone number for all consultation types
    if (!formData.phone) {
      alert('Phone number is required for all consultations.');
      return;
    }

    setLoading(true);
    try {
      // First, upsert the profile data using the profile service
      await profileService.updateUserProfile({
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address || undefined,
        ira_accounts: formData.retirement_account_details || undefined,
        investment_goals: formData.investment_goals || undefined
      });

      // Create consultation request using the CRM service
      await crmService.createConsultationRequest({
        name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email,
        phone: formData.phone,
        suggested_investment_amount: formData.suggested_investment_amount ? parseInt(formData.suggested_investment_amount) : undefined,
        preferred_date: selectedDate,
        preferred_time: selectedTime,
        consultation_type: consultationType,
        notes: formData.notes || undefined
      });

      // Create CRM lead
      try {
        await createLeadFromConsultation({
          name: `${formData.first_name} ${formData.last_name}`,
          email: formData.email,
          phone: formData.phone,
          suggested_investment_amount: formData.suggested_investment_amount ? parseInt(formData.suggested_investment_amount) : undefined,
          preferred_date: selectedDate,
          preferred_time: selectedTime,
          consultation_type: consultationType,
          notes: formData.notes || undefined
        });
      } catch (crmError) {
        console.error('Error creating CRM lead:', crmError);
        // Don't fail the whole process if CRM creation fails
      }

      // Construct Calendly URL with pre-filled data
      const calendlyBaseUrl = consultationType === 'video'
        ? 'https://calendly.com/innercirclelending/30min'
        : 'https://calendly.com/innercirclelending/q-a-phone-chat';

      // Format the date and time for Calendly
      const dateTimeString = `${selectedDate}T${convertTimeToISO(selectedTime)}-05:00`;

      const params = new URLSearchParams();

      // Pre-fill name and email
      if (formData.first_name && formData.last_name) params.append('name', `${formData.first_name} ${formData.last_name}`);
      if (formData.email) params.append('email', formData.email);

      // Add custom questions as URL parameters
      if (formData.notes) params.append('a1', formData.notes);
      if (formData.suggested_investment_amount) params.append('a2', `$${parseInt(formData.suggested_investment_amount).toLocaleString()}`);
      if (formData.investment_goals) params.append('a3', formData.investment_goals);
      if (formData.retirement_account_details) params.append('a4', formData.retirement_account_details);
      if (formData.has_retirement_accounts) params.append('a5', formData.has_retirement_accounts);

      // Add phone number to the dedicated phone field
      if (formData.phone) params.append('phone', formData.phone);

      // Pre-select the date and time
      params.append('date', selectedDate);
      params.append('month', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`);

      const calendlyUrl = `${calendlyBaseUrl}/${dateTimeString}?${params.toString()}`;

      // Open Calendly in new tab
      window.open(calendlyUrl, '_blank');

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting consultation request:', error);
      alert('Failed to submit consultation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertTimeToISO = (time: string) => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.first_name && formData.last_name && formData.email && formData.phone; // Phone is now required
      case 2:
        return true; // Investment background is optional
      case 3:
        return selectedDate && selectedTime; // Date and time selection
      case 4:
        return true; // Final review
      default:
        return false;
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isPast = date < today;

      if (!isWeekend && !isPast) {
        days.push({
          date: dateString,
          display: day.toString(),
          isSelectable: true
        });
      } else {
        days.push({
          date: dateString,
          display: day.toString(),
          isSelectable: false
        });
      }
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const availableTimes = [
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'
  ];

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    const today = new Date();
    const newDate = new Date(currentYear, currentMonth - 1);

    // Don't go to previous months before current month
    if (newDate >= new Date(today.getFullYear(), today.getMonth())) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar - Only show after consultation type selection */}
      {currentStep > 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= step
                  ? 'bg-gold text-background'
                  : 'bg-surface border-2 border-graphite text-text-secondary'
                  }`}>
                  {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 transition-all duration-300 ${currentStep > step ? 'bg-gold' : 'bg-graphite'
                    }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-display font-semibold text-gold mb-2">
              {currentStep === 1 && 'Choose Your Consultation Type'}
              {currentStep === 2 && 'Tell Us About You'}
              {currentStep === 3 && 'Your Investment Background'}
              {currentStep === 4 && 'Choose Your Preferred Time'}
            </h3>
            <p className="text-text-secondary">
              {currentStep === 1 && 'Select your preferred consultation method'}
              {currentStep === 2 && 'Basic contact information'}
              {currentStep === 3 && 'Help us understand your investment experience'}
              {currentStep === 4 && 'Select your preferred date and time'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Consultation Type Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-display font-semibold text-gold mb-4">
                  Choose Your Consultation Type
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  type="button"
                  onClick={() => {
                    setConsultationType('video');
                    nextStep();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-8 rounded-xl border-2 border-graphite bg-surface hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300">
                      <Video className="w-8 h-8 text-gold" />
                    </div>
                    <h4 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                      Video Call
                    </h4>
                    <p className="text-text-secondary text-sm leading-relaxed mb-4">
                      Face-to-face discussion with screen sharing capabilities for reviewing documents and presentations
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>30-45 minutes</span>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    setConsultationType('phone');
                    nextStep();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-8 rounded-xl border-2 border-graphite bg-surface hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300">
                      <Phone className="w-8 h-8 text-gold" />
                    </div>
                    <h4 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                      Phone Call
                    </h4>
                    <p className="text-text-secondary text-sm leading-relaxed mb-4">
                      Personal phone consultation for focused discussion about your investment goals
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>20-30 minutes</span>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                    <User className="w-4 h-4 mr-2 text-gold" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                    <User className="w-4 h-4 mr-2 text-gold" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                    <Mail className="w-4 h-4 mr-2 text-gold" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                  <Phone className="w-4 h-4 mr-2 text-gold" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                  placeholder="(555) 123-4567"
                />
                <p className="text-xs text-text-secondary">
                  Required for all consultations to ensure we can reach you
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                  <Building className="w-4 h-4 mr-2 text-gold" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                  placeholder="Your mailing address"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Investment Background */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                  Do you have an IRA or 401(k) account you want to invest with?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, has_retirement_accounts: 'yes' }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${formData.has_retirement_accounts === 'yes'
                      ? 'border-gold bg-gold/10'
                      : 'border-graphite bg-surface hover:border-gold/50'
                      }`}
                  >
                    <div className="font-semibold mb-2">Yes, I have retirement accounts</div>
                    <p className="text-sm text-text-secondary">
                      I have IRA/401(k) accounts I'd like to use for investment
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, has_retirement_accounts: 'no' }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${formData.has_retirement_accounts === 'no'
                      ? 'border-gold bg-gold/10'
                      : 'border-graphite bg-surface hover:border-gold/50'
                      }`}
                  >
                    <div className="font-semibold mb-2">No, I don't have retirement accounts</div>
                    <p className="text-sm text-text-secondary">
                      I'll be investing with other funds
                    </p>
                  </button>
                </div>
              </div>

              {formData.has_retirement_accounts === 'yes' && (
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                    Retirement Account Details
                  </label>
                  <textarea
                    name="retirement_account_details"
                    value={formData.retirement_account_details}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                    placeholder="Please provide the name of your retirement account provider(s) and any contact information you have (e.g., Fidelity 401k - Contact: John Smith at john@company.com)"
                  />
                  <p className="text-xs text-text-secondary">
                    This helps us understand which providers we can work with and coordinate the investment process.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                  Investment Goals
                </label>
                <textarea
                  name="investment_goals"
                  value={formData.investment_goals}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                  placeholder="Describe your investment objectives, timeline, and what you hope to achieve"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                  <DollarSign className="w-4 h-4 mr-2 text-gold" />
                  Investment Interest Level
                </label>
                <select
                  name="suggested_investment_amount"
                  value={formData.suggested_investment_amount}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                >
                  <option value="">Select investment range</option>
                  <option value="200000">$200,000 - $349,999</option>
                  <option value="350000">$350,000 - $499,999</option>
                  <option value="500000">$500,000 - $999,999</option>
                  <option value="1000000">$1,000,000+</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* Step 4: Date and Time Selection */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {!selectedDate ? (
                <div className="space-y-4">
                  <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                    <Calendar className="w-4 h-4 mr-2 text-gold" />
                    Choose Your Preferred Date
                  </label>

                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="p-2 rounded-lg bg-surface border border-graphite hover:border-gold/50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-semibold">
                      {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-2 rounded-lg bg-surface border border-graphite hover:border-gold/50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-surface rounded-lg border border-graphite p-4">
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-text-secondary py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => (
                        <div key={index} className="aspect-square">
                          {day && (
                            <button
                              type="button"
                              onClick={() => day.isSelectable && setSelectedDate(day.date)}
                              disabled={!day.isSelectable}
                              className={`w-full h-full rounded-lg text-sm transition-all duration-200 ${day.isSelectable
                                ? selectedDate === day.date
                                  ? 'bg-gold text-background font-semibold'
                                  : 'bg-accent hover:bg-gold/20 text-text-primary hover:text-gold'
                                : 'bg-graphite/20 text-text-secondary cursor-not-allowed'
                                }`}
                            >
                              {day.display}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary text-center">
                    Available times: Monday - Friday, 10:00 AM - 3:30 PM EST
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                      <Clock className="w-4 h-4 mr-2 text-gold" />
                      Choose Your Preferred Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedDate('')}
                      className="text-sm text-gold hover:text-gold/80 transition-colors"
                    >
                      Change Date
                    </button>
                  </div>

                  <div className="bg-gold/10 border border-gold/20 p-4 rounded-lg">
                    <p className="text-gold font-medium">
                      Selected Date: {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${selectedTime === time
                          ? 'border-gold bg-gold/10 text-gold font-semibold'
                          : 'border-graphite bg-surface hover:border-gold/50 hover:bg-gold/5 text-text-primary'
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-text-secondary text-center">
                    All times are in Eastern Standard Time (EST)
                  </p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep > 1 && (
          <div className="flex justify-between items-center pt-6 border-t border-graphite">
            <motion.button
              type="button"
              onClick={prevStep}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="button-gold px-6 py-3 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Previous
            </motion.button>

            {currentStep < 4 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                whileHover={{ scale: isStepValid() ? 1.02 : 1 }}
                whileTap={{ scale: isStepValid() ? 0.98 : 1 }}
                className={`button px-6 py-3 flex items-center gap-2 ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <div className="space-y-6 w-full">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-text-secondary uppercase tracking-wide">
                    <MessageSquare className="w-4 h-4 mr-2 text-gold" />
                    Questions or Topics to Discuss (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                    placeholder="Tell us about your investment goals or any specific topics you'd like to discuss..."
                  />
                </div>

                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid()}
                  whileHover={{ scale: !loading && isStepValid() ? 1.02 : 1 }}
                  whileTap={{ scale: !loading && isStepValid() ? 0.98 : 1 }}
                  className={`button px-8 py-3 flex items-center gap-2 ${loading || !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {consultationType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  {loading ? 'Processing...' : 'Submit & Schedule'}
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 p-6 bg-accent rounded-lg border border-graphite">
        <div className="flex items-center justify-center gap-8 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gold" />
            <span>Confidential</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gold" />
            <span>No Obligation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gold" />
            <span>24hr Response</span>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
        onSignUpSuccess={() => {
          setShowAuthModal(false);
          navigate('/verify');
        }}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Reset form
          setFormData({
            first_name: '',
            last_name: '',
            email: user?.email || '',
            phone: '',
            address: '',
            has_retirement_accounts: '',
            retirement_account_details: '',
            investment_goals: '',
            suggested_investment_amount: '',
            notes: ''
          });
          setSelectedDate('');
          setSelectedTime('');
          setCurrentStep(1);
          onSuccess?.();
        }}
        title="Consultation Scheduled Successfully!"
        message="Your consultation request has been submitted and Calendly has been opened with your preferred time. Please complete the scheduling process in the new tab."
      />
    </div>
  );
};

export default ConsultationForm;