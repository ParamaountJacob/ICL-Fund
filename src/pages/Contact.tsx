import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Video, Phone, ArrowLeft, Clock, User, MessageSquare, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { createConsultationRequest } from '../lib/supabase';
import { createLeadFromContact, createLeadFromConsultation } from '../lib/crm';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
import { SuccessModal } from '../components/SuccessModal';
import CalendlyEmbed from '../components/CalendlyEmbed';

type ContactMethod = 'email' | 'video' | 'phone' | null;

const Contact: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<ContactMethod>(null);
  const [user, setUser] = useState<any>(null);
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
    address: '',
    investment_goals: '',
    suggested_investment_amount: '',
    message: ''
  });

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));

        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              setFormData(prev => ({
                ...prev,
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone: profile.phone || '',
                address: profile.address || '',
                investment_goals: profile.investment_goals || ''
              }));
            }
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || ''
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-select today's date if it's available and no date is selected
  React.useEffect(() => {
    if ((selectedMethod === 'video' || selectedMethod === 'phone') && !selectedDate) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;

      if (!isWeekend) {
        setSelectedDate(todayString);
      }
    }
  }, [selectedMethod, selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Allow anonymous call scheduling - no auth required
    // if ((selectedMethod === 'video' || selectedMethod === 'phone') && !user) {
    //   setShowAuthModal(true);
    //   return;
    // }

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
    try {
      // For video and phone consultations, create consultation request and open Calendly
      if (selectedMethod === 'video' || selectedMethod === 'phone') {
        // Skip consultation request creation for anonymous users - just create CRM lead
        // Only create consultation request if user is authenticated
        if (user) {
          try {
            await createConsultationRequest({
              name: `${formData.first_name} ${formData.last_name}`,
              email: formData.email,
              phone: formData.phone,
              suggested_investment_amount: formData.suggested_investment_amount ? parseInt(formData.suggested_investment_amount) : undefined,
              preferred_date: selectedDate,
              preferred_time: selectedTime,
              consultation_type: selectedMethod,
              notes: formData.message || undefined
            });
          } catch (consultationError) {
            console.error('Error creating consultation request:', consultationError);
            // Continue anyway - the Calendly booking is what matters
          }
        }

        // Create CRM lead for consultation (works for anonymous users)
        try {
          await createLeadFromConsultation({
            name: `${formData.first_name} ${formData.last_name}`,
            email: formData.email,
            phone: formData.phone,
            suggested_investment_amount: formData.suggested_investment_amount ? parseInt(formData.suggested_investment_amount) : undefined,
            preferred_date: selectedDate,
            preferred_time: selectedTime,
            consultation_type: selectedMethod,
            notes: formData.message || undefined
          });
        } catch (crmError) {
          console.error('Error creating CRM lead:', crmError);
        }

        const calendlyBaseUrl = selectedMethod === 'video'
          ? 'https://calendly.com/innercirclelending/30min'
          : 'https://calendly.com/innercirclelending/q-a-phone-chat';

        const dateTimeString = `${selectedDate}T${convertTimeToISO(selectedTime)}-05:00`;
        const params = new URLSearchParams();

        if (formData.first_name && formData.last_name) params.append('name', `${formData.first_name} ${formData.last_name}`);
        if (formData.email) params.append('email', formData.email);
        if (formData.message) params.append('a1', formData.message);
        if (formData.suggested_investment_amount) params.append('a2', `$${parseInt(formData.suggested_investment_amount).toLocaleString()}`);
        if (formData.investment_goals) params.append('a3', formData.investment_goals);
        if (formData.phone) params.append('phone', formData.phone);

        params.append('date', selectedDate);
        params.append('month', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`);

        const calendlyUrl = `${calendlyBaseUrl}/${dateTimeString}?${params.toString()}`;

        // Show Calendly embed instead of opening new window
        setCalendlyUrl(calendlyUrl);
        setShowCalendlyEmbed(true);

        // For consultations, don't show success modal - go straight to Calendly
        setLoading(false);
        return;
      } else {
        // Create CRM lead for email contact
        try {
          await createLeadFromContact({
            name: `${formData.first_name} ${formData.last_name}`,
            email: formData.email,
            phone: formData.phone,
            message: formData.message
          });
        } catch (crmError) {
          console.error('Error creating CRM lead:', crmError);
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: `${formData.first_name} ${formData.last_name}`,
              email: formData.email,
              phone: formData.phone,
              message: formData.message
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to send email');
        }
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
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
      email: user?.email || '',
      phone: '',
      address: '',
      investment_goals: '',
      suggested_investment_amount: '',
      message: ''
    });
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
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
                <h1 className="text-4xl font-bold text-text-primary mb-6">Get in Touch</h1>
                <p className="text-lg text-text-secondary">
                  Choose how you'd like to connect with our team
                </p>
              </div>

              <div className="space-y-6">
                <motion.button
                  onClick={() => setSelectedMethod('email')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-8 bg-surface border border-graphite rounded-xl hover:border-gold/50 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300">
                      <Mail className="w-8 h-8 text-gold" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                        Email
                      </h3>
                      <p className="text-text-secondary mb-2">
                        Send us a detailed message about your investment goals
                      </p>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
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
                  className="w-full p-8 bg-surface border border-graphite rounded-xl hover:border-gold/50 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300">
                      <Video className="w-8 h-8 text-gold" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                        Video Call
                      </h3>
                      <p className="text-text-secondary mb-2">
                        Face-to-face consultation with screen sharing
                      </p>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
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
                  className="w-full p-8 bg-surface border border-graphite rounded-xl hover:border-gold/50 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-full bg-accent group-hover:bg-gold/20 flex items-center justify-center transition-all duration-300">
                      <Phone className="w-8 h-8 text-gold" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-text-primary group-hover:text-gold transition-colors">
                        Phone Call
                      </h3>
                      <p className="text-text-secondary mb-2">
                        Direct phone consultation for focused discussion
                      </p>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
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
              <div className="flex items-center gap-4">
                <button
                  onClick={resetForm}
                  className="p-3 rounded-lg bg-surface border border-graphite hover:border-gold/50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  {selectedMethod === 'email' && <Mail className="w-6 h-6 text-gold" />}
                  {selectedMethod === 'video' && <Video className="w-6 h-6 text-gold" />}
                  {selectedMethod === 'phone' && <Phone className="w-6 h-6 text-gold" />}
                  <h1 className="text-2xl font-bold text-text-primary">
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
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required={selectedMethod === 'video' || selectedMethod === 'phone'}
                      className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                      placeholder="(555) 123-4567"
                    />
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

                        <div className="grid grid-cols-2 gap-3">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${selectedTime === time
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

                {/* Message */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                    {selectedMethod === 'email' ? 'Your Message *' : 'Notes (Optional)'}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required={selectedMethod === 'email'}
                    rows={4}
                    className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                    placeholder={
                      selectedMethod === 'email'
                        ? "Tell us about your investment goals and how we can help..."
                        : "Any specific topics you'd like to discuss..."
                    }
                  />
                </div>

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
          title={
            selectedMethod === 'email'
              ? "Message Sent Successfully!"
              : "Consultation Scheduled Successfully!"
          }
          message={
            selectedMethod === 'email'
              ? "Thank you for your message. We'll respond within 1-2 business days."
              : "Your consultation request has been submitted. Please complete the scheduling process in the Calendly embed."
          }
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