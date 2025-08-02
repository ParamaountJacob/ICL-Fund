import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SuccessModal } from '../components/SuccessModal';

const EmailContact: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        countryCode: '+1',
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

    // Auto-populate form from profile data
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone: profile.phone || '',
                investment_goals: profile.investment_goals || ''
            }));
        }
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
        }
    }, [profile, user]);

    // Format phone number with dashes and parentheses
    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 0) return '';
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const formatted = formatPhoneNumber(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate email sending (replace with actual email service)
        setTimeout(() => {
            setLoading(false);
            setShowSuccessModal(true);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-background text-white pt-16">
            <div className="container mx-auto px-6 py-8 max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 rounded-lg bg-surface border border-graphite hover:border-gold/50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <Mail className="w-6 h-6 text-gold" />
                        <h1 className="text-2xl font-bold text-text-primary">Send Email</h1>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-lg text-text-secondary">
                        Send us a detailed message about your investment goals and we'll respond within 1-2 business days.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-3">
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

                        <div>
                            <label className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-3">
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
                    </div>

                    <div>
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-3">
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

                    <div>
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-3">
                            Phone Number (Optional)
                        </label>
                        <div className="flex gap-3">
                            <select
                                name="countryCode"
                                value={formData.countryCode}
                                onChange={handleInputChange}
                                className="bg-surface border border-graphite rounded-lg px-3 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200 w-32 flex-shrink-0"
                            >
                                {countryCodes.map(item => (
                                    <option key={item.code} value={item.code}>{item.code}</option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="flex-1 bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-200"
                                placeholder="(123) 456-7890"
                            />
                        </div>
                    </div>

                    {/* Investment Information */}
                    <div>
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-3">
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

                    <div>
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-3">
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

                    <div>
                        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-3">
                            Your Message *
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            required
                            rows={6}
                            className="w-full bg-surface border border-graphite rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary resize-none transition-all duration-200"
                            placeholder="Tell us about your investment goals and how we can help..."
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full button py-5 text-lg flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        <Send className="w-5 h-5" />
                        {loading ? 'Sending...' : 'Send Message'}
                    </button>
                </form>

                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigate('/contact');
                    }}
                    title="Message Sent Successfully!"
                    message="Thank you for your message. We'll respond within 1-2 business days."
                />
            </div>
        </div>
    );
};

export default EmailContact;
