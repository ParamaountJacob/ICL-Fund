import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, User, MessageSquare, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SuccessModal } from '../components/SuccessModal';

const EmailContact: React.FC = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        countryCode: '+1',
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
        const digits = value.replace(/\D/g, '');

        if (digits.length === 0) return '';
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    // Auto-populate form from profile data
    useEffect(() => {
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
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
        }
    }, [profile, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const formatted = formatPhoneNumber(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, countryCode: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate email sending
        setTimeout(() => {
            setLoading(false);
            setShowSuccessModal(true);
        }, 2000);
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            countryCode: '+1',
            address: '',
            investment_goals: '',
            suggested_investment_amount: '',
            message: ''
        });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header with back button */}
            <div className="p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Send Us a Message</h1>
                        <p className="text-xl text-gray-300">
                            Tell us about your investment goals and we'll respond within 1-2 business days
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 rounded-2xl p-8 border border-gray-800">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white transition-all duration-200"
                                    placeholder="Enter your first name"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white transition-all duration-200"
                                    placeholder="Enter your last name"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white transition-all duration-200"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                Phone Number (Optional)
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    name="countryCode"
                                    value={formData.countryCode}
                                    onChange={handleCountryCodeChange}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white transition-all duration-200 w-full sm:w-32"
                                >
                                    {countryCodes.map(item => (
                                        <option key={item.code} value={item.code}>{item.code} ({item.country})</option>
                                    ))}
                                </select>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white transition-all duration-200"
                                    placeholder="(123) 456-7890"
                                />
                            </div>
                        </div>

                        {/* Investment Information */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                Investment Interest Level (Optional)
                            </label>
                            <select
                                name="suggested_investment_amount"
                                value={formData.suggested_investment_amount}
                                onChange={handleInputChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white transition-all duration-200"
                            >
                                <option value="">Select investment range</option>
                                <option value="200000">$200,000 - $349,999</option>
                                <option value="350000">$350,000 - $499,999</option>
                                <option value="500000">$500,000 - $999,999</option>
                                <option value="1000000">$1,000,000+</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                Investment Goals (Optional)
                            </label>
                            <textarea
                                name="investment_goals"
                                value={formData.investment_goals}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white resize-none transition-all duration-200"
                                placeholder="Describe your investment objectives (optional)"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                Your Message *
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                rows={6}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-white resize-none transition-all duration-200"
                                placeholder="Tell us about your investment goals, questions, or how we can help you..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-5 px-8 rounded-lg text-lg transition-all duration-200 flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Sending Message...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    resetForm();
                }}
                title="Message Sent Successfully!"
                message="Thank you for your message. We'll respond within 1-2 business days."
            />
        </div>
    );
};

export default EmailContact;
