import React from 'react';

const ESSENTIAL_DOCUMENTS = [
    {
        name: 'ICL_Subscription_Agreement_v2.1.pdf',
        description: 'Standard subscription agreement for ICL investments',
        icon: '📄',
        updated: 'August 2025'
    },
    {
        name: 'ICL_Promissory_Note_Template_v1.5.pdf',
        description: 'Promissory note template showing terms and structure',
        icon: '📝',
        updated: 'August 2025'
    },
    {
        name: 'ICL_Investment_Summary.pdf',
        description: 'One-page investment overview and key terms',
        icon: '📊',
        updated: 'August 2025'
    },
    {
        name: 'ICL_Wire_Instructions.pdf',
        description: 'Wire transfer instructions for fund delivery',
        icon: '🏦',
        updated: 'August 2025'
    },
    {
        name: 'ICL_Due_Diligence_Package.pdf',
        description: 'Essential due diligence materials for investor review',
        icon: '🔍',
        updated: 'August 2025'
    }
];

export default function PublicInvestorPortal() {

    function handleDocumentRequest(docName: string) {
        // Instead of downloading, redirect to contact or show message
        const subject = `Request for ${docName.replace('.pdf', '').replace('ICL_', '').replace(/_/g, ' ')}`;
        const body = `Hi Inner Circle Lending,

I would like to request access to the following document: ${docName.replace('.pdf', '').replace('ICL_', '').replace(/_/g, ' ')}

Please provide this document at your earliest convenience.

Thank you,`;

        const mailtoUrl = `mailto:innercirclelending@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4">🏦</div>
                    <h1 className="text-4xl font-bold text-gold mb-4">
                        Inner Circle Lending
                    </h1>
                    <h2 className="text-xl text-white/80 mb-2">
                        Investor Information Portal
                    </h2>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Access essential investment information and request documents.
                        Review our investment tiers, terms, and next steps for getting started.
                    </p>
                </div>

                {/* Key Investment Info */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-black/40 rounded-xl p-6 border border-gold/20 text-center">
                        <div className="text-3xl mb-2">📄</div>
                        <div className="text-lg font-semibold text-gold">{ESSENTIAL_DOCUMENTS.length}</div>
                        <div className="text-sm text-white/60">Available Documents</div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-6 border border-gold/20 text-center">
                        <div className="text-3xl mb-2">💰</div>
                        <div className="text-lg font-semibold text-gold">11-15%</div>
                        <div className="text-sm text-white/60">Fixed Annual Returns</div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-6 border border-gold/20 text-center">
                        <div className="text-3xl mb-2">⚡</div>
                        <div className="text-lg font-semibold text-gold">$200K</div>
                        <div className="text-sm text-white/60">Minimum Investment</div>
                    </div>
                </div>

                {/* Document Request Section */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6 flex items-center gap-3">
                        📋 Request Investment Documents
                    </h3>
                    <p className="text-white/70 mb-6">
                        Click on any document below to request access. We'll send you the documents promptly via email.
                    </p>

                    <div className="grid gap-4">
                        {ESSENTIAL_DOCUMENTS.map((doc, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-5 rounded-xl hover:bg-gold/10 text-white/90 border border-gold/10 hover:border-gold/40 transition-all cursor-pointer group"
                                onClick={() => handleDocumentRequest(doc.name)}
                            >
                                <div className="text-3xl">{doc.icon}</div>

                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-lg group-hover:text-gold transition mb-1">
                                        {doc.name.replace('.pdf', '').replace('ICL_', '').replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-sm text-white/60 mb-1">
                                        {doc.description}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        Updated: {doc.updated}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium">
                                        Request
                                    </div>
                                    <div className="text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-blue-400 text-sm">
                            💡 <strong>Quick Access:</strong> Documents will be sent to your email within 24 hours of request.
                        </p>
                    </div>
                </div>

                {/* Investment Tiers */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6">💰 Investment Tiers & Returns</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10">
                            <div className="text-gold font-semibold">Tier 1</div>
                            <div className="text-white/80 text-sm">$200K - $349K</div>
                            <div className="text-gold font-medium">11-12% Returns</div>
                        </div>
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10">
                            <div className="text-gold font-semibold">Tier 2</div>
                            <div className="text-white/80 text-sm">$350K - $499K</div>
                            <div className="text-gold font-medium">12-13% Returns</div>
                        </div>
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10">
                            <div className="text-gold font-semibold">Tier 3</div>
                            <div className="text-white/80 text-sm">$500K - $999K</div>
                            <div className="text-gold font-medium">13-14% Returns</div>
                        </div>
                        <div className="bg-gray-800/40 rounded-lg p-4 border border-gold/10">
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

                {/* Key Investment Features */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6">✨ Why Choose Inner Circle Lending?</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">🛡️</div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Secured Investments</h4>
                                    <p className="text-white/60 text-sm">Collateralized loans, surety bonds, and reserve funds protect your capital.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">📈</div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Fixed Returns</h4>
                                    <p className="text-white/60 text-sm">Predictable 11-15% annual returns independent of market volatility.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">⚡</div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Quick Deployment</h4>
                                    <p className="text-white/60 text-sm">Short-term loans (1-6 months) allow rapid capital reallocation.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">👨‍💼</div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Family-Run Business</h4>
                                    <p className="text-white/60 text-sm">Decades of experience with personal oversight by Wayne Griswold.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">🎯</div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Privacy-Premium Niche</h4>
                                    <p className="text-white/60 text-sm">Focus on borrowers who value discretion and speed over lowest rates.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">📊</div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Flexible Terms</h4>
                                    <p className="text-white/60 text-sm">Choose 12 or 24-month terms with monthly, quarterly, or annual payouts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-black/40 rounded-2xl p-8 border border-gold/20 mb-8">
                    <h3 className="text-2xl font-semibold text-gold mb-6">🎯 How to Get Started</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-semibold text-sm">1</div>
                            <div>
                                <div className="font-semibold text-white">Request Documents</div>
                                <div className="text-white/60 text-sm">Click on documents above to request subscription agreement, promissory note, and due diligence materials</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-semibold text-sm">2</div>
                            <div>
                                <div className="font-semibold text-white">Schedule Discussion</div>
                                <div className="text-white/60 text-sm">Contact us to discuss your investment amount, term preferences, and answer any questions</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-semibold text-sm">3</div>
                            <div>
                                <div className="font-semibold text-white">Complete Investment</div>
                                <div className="text-white/60 text-sm">Sign documentation and arrange wire transfer to begin earning fixed returns</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-r from-gold/10 to-yellow-500/10 rounded-2xl p-8 border border-gold/30 text-center">
                    <h3 className="text-2xl font-semibold text-gold mb-4">📞 Ready to Start Your Investment?</h3>
                    <p className="text-white/80 mb-6">
                        Contact our team to discuss your investment goals and receive your documents.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="mailto:innercirclelending@gmail.com?subject=Investment Inquiry&body=Hi Inner Circle Lending,%0D%0A%0D%0AI'm interested in learning more about your investment opportunities.%0D%0A%0D%0APlease send me the complete document package and schedule a time to discuss.%0D%0A%0D%0AThank you,"
                            className="px-6 py-3 rounded-xl bg-gold/90 text-black font-semibold hover:bg-yellow-500 transition-all duration-300 inline-flex items-center gap-2 justify-center"
                        >
                            📧 Request All Documents
                        </a>
                        <a
                            href="/contact"
                            className="px-6 py-3 rounded-xl bg-black/40 text-white border border-gold/40 hover:bg-black/60 transition-all duration-300 inline-flex items-center gap-2 justify-center"
                        >
                            📞 Schedule Call
                        </a>
                        <a
                            href="/"
                            className="px-6 py-3 rounded-xl bg-black/40 text-white border border-gold/40 hover:bg-black/60 transition-all duration-300 inline-flex items-center gap-2 justify-center"
                        >
                            🏠 Visit Main Site
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="text-xs text-white/40">
                        © 2025 Inner Circle Lending. Securities offered to accredited investors only.
                        <br />
                        All investments involve risk of loss. Past performance does not guarantee future results.
                    </div>
                </div>
            </div>
        </div>
    );
}
