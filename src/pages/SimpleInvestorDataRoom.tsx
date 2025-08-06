import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const FUND_DOCUMENTS = [
    {
        id: 'ppm',
        name: 'Private Placement Memorandum',
        description: 'Complete fund offering memorandum with terms, risks, and investment details',
        icon: '📄',
        type: 'ppm'
    },
    {
        id: 'pitch-deck',
        name: 'Investment Pitch Deck',
        description: 'Comprehensive presentation covering strategy, market analysis, and projections',
        icon: '�',
        type: 'pitch-deck'
    },
    {
        id: 'investment-thesis',
        name: 'Investment Thesis',
        description: 'Our strategic approach to private lending and market positioning',
        icon: '🎯',
        type: 'document'
    }
];

export default function SimpleInvestorDataRoom() {
    const { user } = useAuth();
    const navigate = useNavigate();

    function handleDocumentClick(doc: typeof FUND_DOCUMENTS[0]) {
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

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-gold/30">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">🏦</div>
                        <h1 className="text-2xl font-bold text-gold mb-2">ICL Fund Data Room</h1>
                        <p className="text-white/70 text-sm mb-4">Access Private Placement Memorandum, Pitch Deck & Investment Thesis</p>

                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 mb-6">
                            <p className="text-blue-400 text-sm">
                                <strong>Quick Account Creation Required</strong><br />
                                Just email + password. Takes 30 seconds.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <a
                            href="/contact"
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-gold/80 to-yellow-500/80 text-black font-semibold hover:from-gold hover:to-yellow-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gold/30 block text-center"
                        >
                            📧 Request Account Access
                        </a>
                        <p className="text-white/50 text-xs text-center">
                            Or contact: innercirclelending@gmail.com
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4">🏦</div>
                    <h1 className="text-4xl font-bold text-gold mb-4">
                        Inner Circle Lending Fund
                    </h1>
                    <h2 className="text-xl text-white/80 mb-2">
                        Private Data Room
                    </h2>
                    <p className="text-white/60 max-w-2xl mx-auto mb-4">
                        Comprehensive fund documentation including our Private Placement Memorandum,
                        Investment Pitch Deck, and Strategic Investment Thesis.
                    </p>
                    <div className="inline-block p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-green-400 text-sm">
                            ✅ Authenticated: {user.user?.email}
                        </p>
                    </div>
                </div>

                {/* Fund Overview - TLDR */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6">📖 About Our Fund</h3>
                    <div className="prose prose-invert max-w-none">
                        <p className="text-white/80 text-lg leading-relaxed mb-6">
                            <strong>Inner Circle Lending is a family-run 506(c) private lending firm</strong> that provides
                            11-15% fixed annual returns through secured business loans. We serve borrowers who value
                            <em> certainty, speed, and discretion</em> over the lowest rate, creating premium yield
                            opportunities for our investors.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 mb-6">
                            <div>
                                <h4 className="text-gold font-semibold mb-3">🎯 Our Unique Approach</h4>
                                <ul className="text-white/70 text-sm space-y-2">
                                    <li>• <strong>Short-term loans</strong> (typically 6 months or less)</li>
                                    <li>• <strong>Privacy-premium borrowers</strong> who pay for discretion</li>
                                    <li>• <strong>Rapid capital reallocation</strong> for market agility</li>
                                    <li>• <strong>Wayne Griswold</strong> personally oversees every deal</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-gold font-semibold mb-3">💰 Investor Benefits</h4>
                                <ul className="text-white/70 text-sm space-y-2">
                                    <li>• <strong>Fixed returns</strong> independent of market volatility</li>
                                    <li>• <strong>Secured investments</strong> with collateral & surety bonds</li>
                                    <li>• <strong>Flexible terms</strong> (12-24 months, +1% for 2-year)</li>
                                    <li>• <strong>Multiple protection layers</strong> including reserve funds</li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
                            <p className="text-gold text-sm">
                                <strong>Key Differentiator:</strong> We focus on privacy-premium niches where discretion
                                commands higher yields. Our borrowers avoid public institutions by design and are willing
                                to pay a premium for confidentiality and speed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fund Documents */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6 flex items-center gap-3">
                        📋 Fund Documentation
                    </h3>

                    <div className="grid gap-6">
                        {FUND_DOCUMENTS.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center gap-6 p-6 rounded-xl hover:bg-gold/10 text-white/90 border border-gold/10 hover:border-gold/40 transition-all cursor-pointer group"
                                onClick={() => handleDocumentClick(doc)}
                            >
                                <div className="text-4xl">{doc.icon}</div>

                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-xl group-hover:text-gold transition mb-2">
                                        {doc.name}
                                    </div>
                                    <div className="text-sm text-white/60 mb-2">
                                        {doc.description}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        Updated: August 2025
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-2 rounded-lg bg-gold/20 text-gold text-sm font-medium">
                                        {doc.type === 'pitch-deck' ? 'View Presentation' : 'View Document'}
                                    </div>
                                    <div className="text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-blue-400 text-sm">
                            💡 <strong>Note:</strong> Documents are updated regularly. The Pitch Deck is available immediately.
                            PPM and Investment Thesis documents are being finalized - contact us for current versions.
                        </p>
                    </div>
                </div>

                {/* Family Leadership */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6">👨‍👩‍👦 The Griswold Family</h3>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="text-center">
                            <img
                                src="https://res.cloudinary.com/digjsdron/image/upload/v1746554204/Wayne_Griswold_o3w3rl.webp"
                                alt="Wayne Griswold"
                                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                            />
                            <h4 className="text-xl font-semibold text-gold mb-2">Wayne Griswold</h4>
                            <p className="text-white/80 text-sm mb-3">Founder & Chief Investment Officer</p>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Decades of experience in structured private lending, delivering disciplined, secure,
                                and consistent returns for investors. Wayne personally oversees every deal with a focus
                                on privacy, performance, and protection.
                            </p>
                        </div>

                        <div className="text-center">
                            <img
                                src="https://res.cloudinary.com/digjsdron/image/upload/v1746554203/Michael_Griswold_aknxin.webp"
                                alt="Michael Griswold"
                                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                            />
                            <h4 className="text-xl font-semibold text-gold mb-2">Michael Griswold</h4>
                            <p className="text-white/80 text-sm mb-3">Head of Strategic Lending</p>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Focused on developing discreet, high-value lending relationships with businesses that
                                value speed and privacy. Michael drives the creation of exclusive lending relationships
                                that allow ICL to offer strong, fixed returns.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-gold/5 rounded-lg border border-gold/10">
                        <h4 className="text-gold font-semibold mb-3">🏠 Family-Run Business Values</h4>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Unlike institutional funds, Inner Circle Lending operates with the personal attention and
                            accountability that comes from family ownership. Every investment decision reflects our
                            commitment to both investor success and borrower privacy. We're not a startup fund -
                            we're a family business with decades of experience.
                        </p>
                    </div>
                </div>

                {/* Investment Tiers */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6">💰 Investment Tiers</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10 text-center">
                            <div className="text-gold font-semibold">Tier 1</div>
                            <div className="text-white/80 text-sm">$200K - $349K</div>
                            <div className="text-gold font-medium">11-12% Returns</div>
                        </div>
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10 text-center">
                            <div className="text-gold font-semibold">Tier 2</div>
                            <div className="text-white/80 text-sm">$350K - $499K</div>
                            <div className="text-gold font-medium">12-13% Returns</div>
                        </div>
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10 text-center">
                            <div className="text-gold font-semibold">Tier 3</div>
                            <div className="text-white/80 text-sm">$500K - $999K</div>
                            <div className="text-gold font-medium">13-14% Returns</div>
                        </div>
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10 text-center">
                            <div className="text-gold font-semibold">Tier 4</div>
                            <div className="text-white/80 text-sm">$1M+</div>
                            <div className="text-gold font-medium">14-15% Returns</div>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-green-400 text-sm">
                            💡 <strong>2-Year Bonus:</strong> Add +1% to any tier with 24-month commitment
                        </p>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-gold/10 to-yellow-500/10 rounded-2xl p-8 border border-gold/30 text-center">
                    <h3 className="text-2xl font-semibold text-gold mb-4">📞 Ready to Invest?</h3>
                    <p className="text-white/80 mb-6">
                        Contact our team to discuss your investment and begin the process.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="mailto:innercirclelending@gmail.com"
                            className="px-6 py-3 rounded-xl bg-gold/90 text-black font-semibold hover:bg-yellow-500 transition-all duration-300 inline-flex items-center gap-2 justify-center"
                        >
                            📧 Email Us
                        </a>
                        <a
                            href="/contact"
                            className="px-6 py-3 rounded-xl bg-black/40 text-white border border-gold/40 hover:bg-black/60 transition-all duration-300 inline-flex items-center gap-2 justify-center"
                        >
                            � Schedule Call
                        </a>
                        <a
                            href="/"
                            className="px-6 py-3 rounded-xl bg-black/40 text-white border border-gold/40 hover:bg-black/60 transition-all duration-300 inline-flex items-center gap-2 justify-center"
                        >
                            🏠 Return to Site
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="text-xs text-white/40">
                        © 2025 Inner Circle Lending. Private fund documentation for accredited investors.
                        <br />
                        All investments involve risk of loss. Past performance does not guarantee future results.
                    </div>
                </div>
            </div>
        </div>
    );
}
