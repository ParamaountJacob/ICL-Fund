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
    areaCode: '346', // Default to 346 (Houston)
    address: '',
    investment_goals: '',
    suggested_investment_amount: '',
    message: ''
  });

  // Common US area codes
  const areaCodes = [
    '346', '713', '281', // Houston area
    '214', '469', '972', // Dallas area
    '512', '737', // Austin area
    '210', '726', // San Antonio area
    '817', '682', // Fort Worth area
    '915', // El Paso
    '979', '409', // Other Texas
    '212', '646', '917', // New York
    '310', '323', '424', // Los Angeles
    '312', '773', '872', // Chicago
    '305', '786', '954', // Miami/Fort Lauderdale
    '404', '470', '678', // Atlanta
    '206', '253', '425', // Seattle
    '602', '480', '623', // Phoenix
    '617', '857', '781', // Boston
    '415', '628', '650', // San Francisco
  ];

  // Format phone number with dashes (XXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XXX-XXXX (7 digits max after area code)
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
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

  const handleAreaCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, areaCode: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine area code and phone number for full phone number
    const fullPhoneNumber = `(${formData.areaCode}) ${formData.phone}`;

    // Basic validation
    if (selectedMethod === 'video' || selectedMethod === 'phone') {
      if (!selectedDate || !selectedTime) {
        alert('Please select both a date and time for your consultation.');
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
          ? 'https://calendly.com/your-team/video-consultation'
          : 'https://calendly.com/your-team/phone-consultation';

        // Add prefill data to Calendly URL
        const urlParams = new URLSearchParams({
          'prefill[name]': `${formData.first_name} ${formData.last_name}`,
          'prefill[email]': formData.email,
          'prefill[a1]': fullPhoneNumber, // Use the full formatted phone number
          'prefill[a2]': formData.suggested_investment_amount || '',
          'prefill[a3]': selectedTime,
          'prefill[a4]': selectedDate
        });

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
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
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

              <form onSubmit={handleSubmit} className="space-y-8">
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
                    <div className="flex gap-3">
                      {/* Area Code Dropdown */}
                      <select
                        name="areaCode"
                        value={formData.areaCode}
                        onChange={handleAreaCodeChange}
                        className="bg-surface border border-graphite rounded-lg px-3 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200 flex-shrink-0"
                        style={{ width: '90px' }}
                      >
                        {areaCodes.map(code => (
                          <option key={code} value={code}>({code})</option>
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
                        placeholder="266-1456"
                        maxLength={8} // XXX-XXXX format
                      />
                    </div>
                    <p className="text-xs text-text-secondary">
                      Format: ({formData.areaCode}) {formData.phone || '266-1456'}
                    </p>
                  </div>
                </div>

                {/* Investment Information */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                      Investment Interest Level
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
                  <div className="space-y-6">
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
                            {new Date(selectedDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full button py-5 text-lg flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''
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
      </div>
    </div>
  );
};

export default Contact;