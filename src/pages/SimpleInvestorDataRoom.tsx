import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import {
    FileText,
    PresentationChart,
    Target,
    Shield,
    TrendingUp,
    Users,
    Mail,
    Phone,
    Home
} from 'lucide-react';

const FUND_DOCUMENTS = [
    {
        id: 'ppm',
        name: 'Private Placement Memorandum',
        description: 'Complete fund offering memorandum with terms, risks, and investment details',
        icon: FileText,
        type: 'ppm'
    },
    {
        id: 'pitch-deck',
        name: 'Investment Pitch Deck',
        description: 'Comprehensive presentation covering strategy, market analysis, and projections',
        icon: PresentationChart,
        type: 'pitch-deck'
    },
    {
        id: 'investment-thesis',
        name: 'Investment Thesis',
        description: 'Our strategic approach to private lending and market positioning',
        icon: Target,
        type: 'document'
    }
];

export default function SimpleInvestorDataRoom() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingDocument, setPendingDocument] = useState<typeof FUND_DOCUMENTS[0] | null>(null);

    // Show auth modal immediately if not logged in
    useEffect(() => {
        if (!user) {
            setShowAuthModal(true);
        }
    }, [user]);

    function handleDocumentClick(doc: typeof FUND_DOCUMENTS[0]) {
        // Check if user is logged in
        if (!user) {
            // Set pending document and show auth modal
            setPendingDocument(doc);
            setShowAuthModal(true);
            return;
        }

        // User is logged in, proceed with document access
        executeDocumentAction(doc);
    }

    function executeDocumentAction(doc: typeof FUND_DOCUMENTS[0]) {
        if (doc.type === 'pitch-deck') {
            // Navigate to existing pitch deck page
            navigate('/pitch-deck');
        } else if (doc.type === 'ppm') {
            // For now, open a placeholder or future PPM link
            // You can replace this with actual PPM document link when available
            alert('PPM document access will be available soon. Please contact us for immediate access.');
        } else {
            // Handle other documents (investment thesis)
            alert('Document access will be available soon. Please contact us for immediate access.');
        }
    }

    const handleAuthSuccess = () => {
        setShowAuthModal(false);

        // Execute the pending document action after successful authentication
        if (pendingDocument) {
            executeDocumentAction(pendingDocument);
        }

        // Clear pending document
        setPendingDocument(null);
    };

    const handleAuthClose = () => {
        setShowAuthModal(false);
        setPendingDocument(null);
        // Redirect to home if they close without logging in
        navigate('/');
    };

    return (
        <div className="pt-0">
            <section className="py-20 sm:py-32 md:py-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    {/* Hero Section */}
                    <div className="text-center mb-20 sm:mb-32">
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-gold mb-6 sm:mb-8 px-4 sm:px-0">
                            Private Data Room
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
                            Comprehensive fund documentation including our Private Placement Memorandum,
                            Investment Pitch Deck, and Strategic Investment Thesis.
                        </p>
                        {user && (
                            <div className="mt-8 inline-block p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                <p className="text-green-400">
                                    ✅ Authenticated: {user.user?.email}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Fund Overview */}
                    <div className="mb-20 sm:mb-32 px-2 sm:px-0">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold mb-4 sm:mb-6">
                                About Inner Circle Lending Fund
                            </h2>
                            <p className="text-base md:text-lg text-text-secondary max-w-3xl mx-auto">
                                A family-run 506(c) private lending firm delivering 11-15% fixed annual returns
                                through secured business loans to privacy-premium borrowers.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
                            <div>
                                <h3 className="text-xl md:text-2xl font-semibold mb-6">Our Unique Approach</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Privacy-Premium Borrowers</h4>
                                            <p className="text-text-secondary text-sm">Clients who pay extra for discretion and speed</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Short-Term Focus</h4>
                                            <p className="text-text-secondary text-sm">Typically 6 months or less for rapid reallocation</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Users className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Family Oversight</h4>
                                            <p className="text-text-secondary text-sm">Wayne Griswold personally reviews every deal</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface p-6 sm:p-8 md:p-10 rounded-xl border border-graphite">
                                <h3 className="text-xl sm:text-2xl font-semibold text-gold mb-6 sm:mb-8">Investment Tiers</h3>
                                <div className="space-y-4">
                                    <div className="bg-accent p-4 sm:p-5 md:p-6 rounded-lg border border-graphite">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold text-lg">Tier 1</h4>
                                            <span className="text-gold font-semibold">11%</span>
                                        </div>
                                        <p className="text-text-secondary text-sm">$200,000 - $349,999</p>
                                    </div>
                                    <div className="bg-accent p-4 sm:p-5 md:p-6 rounded-lg border border-graphite">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold text-lg">Tier 2</h4>
                                            <span className="text-gold font-semibold">12%</span>
                                        </div>
                                        <p className="text-text-secondary text-sm">$350,000 - $499,999</p>
                                    </div>
                                    <div className="bg-accent p-4 sm:p-5 md:p-6 rounded-lg border border-graphite">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold text-lg">Tier 3</h4>
                                            <span className="text-gold font-semibold">13%</span>
                                        </div>
                                        <p className="text-text-secondary text-sm">$500,000 - $999,999</p>
                                    </div>
                                    <div className="bg-accent p-4 sm:p-5 md:p-6 rounded-lg border border-graphite">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold text-lg">Tier 4</h4>
                                            <span className="text-gold font-semibold">14%</span>
                                        </div>
                                        <p className="text-text-secondary text-sm">$1,000,000+</p>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <p className="text-green-400 text-sm">
                                        💡 <strong>2-Year Bonus:</strong> Add +1% to any tier with 24-month commitment
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fund Documents */}
                    <div className="mb-20 sm:mb-32 px-2 sm:px-0">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold mb-4 sm:mb-6">
                                Fund Documentation
                            </h2>
                            <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto">
                                Access our comprehensive investment documents
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto grid gap-6">
                            {FUND_DOCUMENTS.map((doc) => {
                                const IconComponent = doc.icon;
                                return (
                                    <div
                                        key={doc.id}
                                        className="bg-surface p-6 sm:p-8 rounded-xl border border-graphite hover:border-gold/50 transition-all cursor-pointer group shadow-lg hover:shadow-xl"
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                <IconComponent className="w-8 h-8 text-gold" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-xl mb-2 group-hover:text-gold transition">
                                                    {doc.name}
                                                </h3>
                                                <p className="text-text-secondary text-sm mb-2">
                                                    {doc.description}
                                                </p>
                                                <p className="text-xs text-text-secondary/60">
                                                    Updated: August 2025
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="px-6 py-3 rounded-xl bg-gold/10 text-gold font-semibold border border-gold/20 group-hover:bg-gold group-hover:text-background transition-all">
                                                    {doc.type === 'pitch-deck' ? 'View Presentation' : 'View Document'}
                                                </div>
                                                <div className="text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 max-w-4xl mx-auto p-6 bg-accent rounded-xl border border-graphite">
                            <p className="text-text-secondary text-sm text-center">
                                💡 <strong>Note:</strong> Documents are updated regularly. The Pitch Deck is available immediately.
                                PPM and Investment Thesis documents are being finalized - contact us for current versions.
                            </p>
                        </div>
                    </div>

                    {/* Leadership Section */}
                    <div className="mb-20 sm:mb-32 px-2 sm:px-0">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold mb-6">
                                The Griswold Family
                            </h2>
                            <p className="text-base md:text-lg text-text-secondary max-w-3xl mx-auto">
                                Family-run business with decades of experience and personal accountability
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
                            <div className="text-center">
                                <img
                                    src="https://res.cloudinary.com/digjsdron/image/upload/v1746554204/Wayne_Griswold_o3w3rl.webp"
                                    alt="Wayne Griswold"
                                    className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-2 border-gold/20"
                                />
                                <h3 className="text-xl font-semibold text-gold mb-2">Wayne Griswold</h3>
                                <p className="text-text-secondary mb-4">Founder & Chief Investment Officer</p>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    Decades of experience in structured private lending, delivering disciplined, secure,
                                    and consistent returns for investors. Wayne personally oversees every deal with a focus
                                    on privacy, performance, and protection.
                                </p>
                            </div>

                            <div className="text-center">
                                <img
                                    src="https://res.cloudinary.com/digjsdron/image/upload/v1746554203/Michael_Griswold_aknxin.webp"
                                    alt="Michael Griswold"
                                    className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-2 border-gold/20"
                                />
                                <h3 className="text-xl font-semibold text-gold mb-2">Michael Griswold</h3>
                                <p className="text-text-secondary mb-4">Head of Strategic Lending</p>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    Focused on developing discreet, high-value lending relationships with businesses that
                                    value speed and privacy. Michael drives the creation of exclusive lending relationships
                                    that allow ICL to offer strong, fixed returns.
                                </p>
                            </div>
                        </div>

                        <div className="mt-12 max-w-4xl mx-auto bg-surface p-6 sm:p-8 rounded-xl border border-graphite">
                            <h4 className="text-gold font-semibold text-center mb-4">Family-Run Business Values</h4>
                            <p className="text-text-secondary text-sm text-center leading-relaxed">
                                Unlike institutional funds, Inner Circle Lending operates with the personal attention and
                                accountability that comes from family ownership. Every investment decision reflects our
                                commitment to both investor success and borrower privacy.
                            </p>
                        </div>
                    </div>

                    {/* Ready to Invest CTA */}
                    <div className="bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 rounded-2xl p-6 sm:p-8 md:p-12 text-center mb-20 md:mb-0 mx-2 sm:mx-0">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-gold mb-4 sm:mb-6 leading-tight">
                                Ready to Start Earning?
                            </h2>
                            <p className="text-lg sm:text-xl text-text-secondary mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0">
                                Join our exclusive group of investors and start earning consistent returns.
                                Our streamlined onboarding process makes it easy to begin your investment journey today.
                            </p>

                            <div className="space-y-6 sm:space-y-8">
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a
                                        href="mailto:innercirclelending@gmail.com"
                                        className="bg-gold text-background px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-semibold rounded-xl hover:bg-gold/90 transition-all duration-300 inline-flex items-center gap-3 sm:gap-4 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto justify-center"
                                    >
                                        <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                                        Start Investing
                                    </a>
                                    <a
                                        href="/contact"
                                        className="bg-surface text-text-primary border border-graphite px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-semibold rounded-xl hover:bg-accent transition-all duration-300 inline-flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center"
                                    >
                                        <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                                        Schedule Call
                                    </a>
                                    <a
                                        href="/"
                                        className="bg-surface text-text-primary border border-graphite px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-semibold rounded-xl hover:bg-accent transition-all duration-300 inline-flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center"
                                    >
                                        <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                                        Return to Site
                                    </a>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 text-sm text-text-secondary px-2 sm:px-0">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-gold flex-shrink-0" />
                                        <span>Secure & Confidential</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-gold flex-shrink-0" />
                                        <span>Consistent Returns</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gold flex-shrink-0" />
                                        <span>Family-Run Business</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={handleAuthClose}
                onSuccess={handleAuthSuccess}
                onSignUpSuccess={handleAuthSuccess}
            />
        </div>
    );
}
