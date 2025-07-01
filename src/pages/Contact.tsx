import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Video, Phone, ArrowLeft, Clock, User, MessageSquare, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { SuccessModal } from '../components/SuccessModal';
import CalendlyEmbed from '../components/CalendlyEmbed';

type ContactMethod = 'email' | 'video' | 'phone' | null;

const Contact: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<ContactMethod>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCalendlyEmbed, setShowCalendlyEmbed] = useState(false);
  const [showDateTimeReminder, setShowDateTimeReminder] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    countryCode: '+1', // Default to +1 (US/Canada)
    address: '',
    investment_goals: '',
    suggested_investment_amount: '',
    message: ''
  });

  // Country codes for international phone numbers
  const countryCodes = [
    { code: '+1', country: 'US/Canada' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+33', country: 'France' },
    { code: '+49', country: 'Germany' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+31', country: 'Netherlands' },
    { code: '+32', country: 'Belgium' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+45', country: 'Denmark' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+358', country: 'Finland' },
    { code: '+351', country: 'Portugal' },
    { code: '+353', country: 'Ireland' },
    { code: '+61', country: 'Australia' },
    { code: '+64', country: 'New Zealand' },
    { code: '+81', country: 'Japan' },
    { code: '+82', country: 'South Korea' },
    { code: '+86', country: 'China' },
    { code: '+91', country: 'India' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+27', country: 'South Africa' }
  ];

  // Format phone number with dashes and parentheses
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers, or just add dashes for others
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Initialize date to today for scheduling
  React.useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());

    // Set default date to today if it's a selectable day (weekday)
    const dayOfWeek = now.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
      const today = now.toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      // Format phone number automatically
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, countryCode: e.target.value }));
  };

  // Function to scroll to date/time section
  const scrollToDateTimeSection = () => {
    const dateTimeSection = document.getElementById('date-time-section');
    if (dateTimeSection) {
      dateTimeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine country code and phone number for full phone number
    const fullPhoneNumber = `${formData.countryCode} ${formData.phone}`;

    // Basic validation
    if (selectedMethod === 'video' || selectedMethod === 'phone') {
      // Check if date/time is missing and show beautiful popup
      if (!selectedDate || !selectedTime) {
        setShowDateTimeReminder(true);
        return;
      }
      if (!formData.phone) {
        alert('Phone number is required for consultations.');
        return;
      }
    }

    setLoading(true);

    // For email - just demo simulation
    if (selectedMethod === 'email') {
      setTimeout(() => {
        setLoading(false);
        setShowSuccessModal(true);
      }, 2000);
    } else {
      // For video/phone calls - show Calendly integration
      setTimeout(() => {
        setLoading(false);
        // Set up Calendly URL based on consultation type
        const baseUrl = selectedMethod === 'video'
          ? 'https://calendly.com/innercirclelending/30min'
          : 'https://calendly.com/innercirclelending/q-a-phone-chat';

        // Add prefill data to Calendly URL
        // Format investment amount for display
        const getInvestmentAmountText = (amount: string) => {
          const amountMap: { [key: string]: string } = {
            '200000': '$200,000 - $349,999',
            '350000': '$350,000 - $499,999',
            '500000': '$500,000 - $999,999',
            '1000000': '$1,000,000+'
          };
          return amountMap[amount] || amount;
        };

        // Create formatted details for Calendly
        const detailsParts: string[] = [];

        // Add phone number
        if (fullPhoneNumber) {
          detailsParts.push(`Phone: ${fullPhoneNumber}`);
        }

        // Add investment interest level
        if (formData.suggested_investment_amount) {
          detailsParts.push(`Investment Interest: ${getInvestmentAmountText(formData.suggested_investment_amount)}`);
        }

        // Add investment goals
        if (formData.investment_goals) {
          detailsParts.push(`Investment Goals: ${formData.investment_goals}`);
        }

        // Add selected date and time if available
        if (selectedDate) {
          detailsParts.push(`Preferred Date: ${selectedDate}`);
        }
        if (selectedTime) {
          detailsParts.push(`Preferred Time: ${selectedTime}`);
        }

        // Add custom message
        if (formData.message) {
          detailsParts.push(`Additional Notes: ${formData.message}`);
        }

        const formattedDetails = detailsParts.join('\n');

        const urlParams = new URLSearchParams({
          'name': `${formData.first_name} ${formData.last_name}`,
          'email': formData.email,
          'a1': formattedDetails // All formatted details in one field
        });

        // Add date/time parameters if available for Calendly to auto-select
        if (selectedDate && selectedTime) {
          const dateTime = convertTimeToISO(selectedTime);
          if (dateTime) {
            urlParams.set('date', selectedDate);
            urlParams.set('time', selectedTime);
          }
        }

        setCalendlyUrl(`${baseUrl}?${urlParams.toString()}`);
        setShowCalendlyEmbed(true);
      }, 2000);
    }
  };

  const convertTimeToISO = (time: string) => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const generateCalendarDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isPast = date < today; // Now properly compares dates

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

    if (newDate >= new Date(today.getFullYear(), today.getMonth())) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  const resetForm = () => {
    setSelectedMethod(null);
    setSelectedDate('');
    setSelectedTime('');
    setShowDateTimeReminder(false);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      countryCode: '+1', // Reset to default country code
      address: '',
      investment_goals: '',
      suggested_investment_amount: '',
      message: ''
    });
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {!selectedMethod ? (
            <motion.div
              key="method-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-12"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">Get in Touch</h1>
                <p className="text-base sm:text-lg text-text-secondary">
                  Choose how you'd like to connect with our team
                </p>
              </div>

              <div className="space-y-6">
                <motion.button
                  onClick={() => setSelectedMethod('email')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-6 sm:p-8 bg-surface border border-graphite rounded-xl hover:border-gold/50 transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                    <div className="w-16 h-16 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300 flex-shrink-0">
                      <Mail className="w-8 h-8 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                        Email
                      </h3>
                      <p className="text-text-secondary mb-2">
                        Send us a detailed message about your investment goals
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
                        <Clock className="w-4 h-4" />
                        <span>1-2 days</span>
                      </div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setSelectedMethod('video')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-6 sm:p-8 bg-surface border border-graphite rounded-xl hover:border-gold/50 transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                    <div className="w-16 h-16 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300 flex-shrink-0">
                      <Video className="w-8 h-8 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                        Video Call
                      </h3>
                      <p className="text-text-secondary mb-2">
                        Face-to-face consultation with screen sharing
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
                        <Clock className="w-4 h-4" />
                        <span>Same day</span>
                      </div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setSelectedMethod('phone')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-6 sm:p-8 bg-surface border border-graphite rounded-xl hover:border-gold/50 transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                    <div className="w-16 h-16 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300 flex-shrink-0">
                      <Phone className="w-8 h-8 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                        Phone Call
                      </h3>
                      <p className="text-text-secondary mb-2">
                        Direct phone consultation for focused discussion
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
                        <Clock className="w-4 h-4" />
                        <span>3-4 hours</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="contact-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={resetForm}
                  className="p-3 rounded-lg bg-surface border border-graphite hover:border-gold/50 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 min-w-0">
                  {selectedMethod === 'email' && <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />}
                  {selectedMethod === 'video' && <Video className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />}
                  {selectedMethod === 'phone' && <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />}
                  <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">
                    {selectedMethod === 'email' && 'Send Email'}
                    {selectedMethod === 'video' && 'Schedule Video Call'}
                    {selectedMethod === 'phone' && 'Schedule Phone Call'}
                  </h1>
                </div>
              </div>

              <form id="contact-form" onSubmit={handleSubmit} className="space-y-8 pb-20 sm:pb-0">{/* Add bottom padding on mobile for sticky button */}
                {/* Basic Information */}
                <div className="space-y-6">
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
                      className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
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
                      className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                      placeholder="Enter your last name"
                    />
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
                      className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                      Phone Number {(selectedMethod === 'video' || selectedMethod === 'phone') ? '*' : '(Optional)'}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Country Code Dropdown */}
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleCountryCodeChange}
                        className="bg-surface border border-graphite rounded-lg px-3 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200 w-full sm:w-32 flex-shrink-0"
                      >
                        {countryCodes.map(item => (
                          <option key={item.code} value={item.code}>{item.code} ({item.country})</option>
                        ))}
                      </select>

                      {/* Phone Number Input */}
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required={selectedMethod === 'video' || selectedMethod === 'phone'}
                        className="flex-1 bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                        placeholder="(123) 456-7890"
                      />
                    </div>
                    <p className="text-xs text-text-secondary">
                      Format: {formData.countryCode} {formData.phone || '(123) 456-7890'}
                    </p>
                  </div>
                </div>

                {/* Investment Information */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                      Investment Interest Level (Optional)
                    </label>
                    <select
                      name="suggested_investment_amount"
                      value={formData.suggested_investment_amount}
                      onChange={handleInputChange}
                      className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
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
                      Investment Goals (Optional)
                    </label>
                    <textarea
                      name="investment_goals"
                      value={formData.investment_goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                      placeholder="Describe your investment objectives (optional)"
                    />
                  </div>
                </div>

                {/* Date and Time Selection for Video/Phone */}
                {(selectedMethod === 'video' || selectedMethod === 'phone') && (
                  <div id="date-time-section" className="space-y-6">
                    <h3 className="text-lg font-semibold text-gold">Schedule Your Call</h3>

                    {!selectedDate ? (
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                          Choose Your Preferred Date
                        </label>

                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={prevMonth}
                            className="p-3 rounded-lg bg-surface border border-graphite hover:border-gold/50 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <h4 className="text-xl font-semibold">
                            {monthNames[currentMonth]} {currentYear}
                          </h4>
                          <button
                            type="button"
                            onClick={nextMonth}
                            className="p-3 rounded-lg bg-surface border border-graphite hover:border-gold/50 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

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
                                    className={`w-full h-full rounded-lg text-sm transition-all duration-200 ${day.isSelectable
                                      ? selectedDate === day.date
                                        ? 'bg-gold text-background font-bold shadow-lg ring-2 ring-gold/50'
                                        : 'bg-gold/10 border-2 border-gold/30 text-gold font-semibold hover:bg-gold/20 hover:border-gold/50 hover:shadow-md'
                                      : 'bg-transparent text-text-secondary/60 hover:bg-surface/50 cursor-default'
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
                          Available: Monday - Friday, 10:00 AM - 3:30 PM EST
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
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
                            {(() => {
                              // Parse date correctly to avoid timezone issues
                              const [year, month, day] = selectedDate.split('-').map(Number);
                              const date = new Date(year, month - 1, day); // month is 0-indexed
                              return date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            })()}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-center text-sm sm:text-base ${selectedTime === time
                                ? 'border-gold bg-gold/10 text-gold font-semibold'
                                : 'border-graphite bg-surface hover:border-gold/50 hover:bg-gold/5 text-text-primary'
                                }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message - Only for email contacts */}
                {selectedMethod === 'email' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                      Your Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required={selectedMethod === 'email'}
                      rows={4}
                      className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                      placeholder="Tell us about your investment goals and how we can help..."
                    />
                  </div>
                )}

                {/* Submit Button - Hidden on mobile (shown in sticky footer) */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`hidden sm:flex w-full button py-5 text-lg items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {selectedMethod === 'email' && <Mail className="w-5 h-5" />}
                  {selectedMethod === 'video' && <Video className="w-5 h-5" />}
                  {selectedMethod === 'phone' && <Phone className="w-5 h-5" />}
                  {loading ? 'Processing...' :
                    selectedMethod === 'email' ? 'Send Message' : 'Schedule Call'
                  }
                </button>
              </form>

              {/* Sticky Submit Button for Mobile */}
              <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-graphite p-4 z-40">
                <button
                  type="submit"
                  form="contact-form"
                  disabled={loading}
                  className={`w-full button py-4 text-lg flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {selectedMethod === 'email' && <Mail className="w-5 h-5" />}
                  {selectedMethod === 'video' && <Video className="w-5 h-5" />}
                  {selectedMethod === 'phone' && <Phone className="w-5 h-5" />}
                  {loading ? 'Processing...' :
                    selectedMethod === 'email' ? 'Send Message' : 'Schedule Call'
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            resetForm();
          }}
          title="Message Sent Successfully!"
          message="Thank you for your message. We'll respond within 1-2 business days."
        />

        <CalendlyEmbed
          isOpen={showCalendlyEmbed}
          onClose={() => setShowCalendlyEmbed(false)}
          calendlyUrl={calendlyUrl}
          consultationType={selectedMethod as 'video' | 'phone'}
        />

        {/* Date/Time Reminder Popup */}
        <AnimatePresence>
          {showDateTimeReminder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDateTimeReminder(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-surface border border-gold/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gold" />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-text-primary">
                      Please Choose Date & Time
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {!selectedDate && !selectedTime
                        ? "To schedule your consultation, please select both a preferred date and time."
                        : !selectedDate
                          ? "Please select your preferred date for the consultation."
                          : "Please select your preferred time for the consultation."
                      }
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowDateTimeReminder(false);
                      setTimeout(() => scrollToDateTimeSection(), 100);
                    }}
                    className="w-full button py-3 px-6 text-base font-medium flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Choose Date & Time
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Contact;