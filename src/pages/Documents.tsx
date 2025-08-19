import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PitchDeckContent from '../components/PitchDeckContent';

const Documents: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const view = (params.get('view') || 'deck') as 'deck' | 'onepager';
    const onePagerUrl = 'https://res.cloudinary.com/digjsdron/image/upload/v1755564365/ICL_One_Pager_od3vha.webp';
    const [onePagerOpen, setOnePagerOpen] = React.useState(false);
    const modalRef = React.useRef<HTMLDivElement>(null);

    const setView = (next: 'deck' | 'onepager') => {
        const nextParams = new URLSearchParams(params);
        nextParams.set('view', next);
        setParams(nextParams, { replace: true });
    };

    return (
        <div className="pt-16 md:pt-20">
            <section className="py-12 sm:py-16 md:py-24">
                <div className="section px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl sm:max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-14 text-center"
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight mb-3 sm:mb-4">Investor Documents</h1>
                        <p className="text-base sm:text-lg md:text-xl text-text-secondary leading-relaxed">Access our Pitch Deck and One-Pager without logging in.</p>
                        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
                            Inner Circle Lending focuses on private credit opportunities with a disciplined, fundamentals-driven approach. We prioritize prudent underwriting, risk management, and reliable cash flow structures across 12–24 month horizons.
                        </p>
                    </motion.div>

                    <div className="max-w-6xl mx-auto">
                        {/* Subtle market context footnote */}
                        <div className="text-center text-xs md:text-sm text-text-secondary/80 mb-4 sm:mb-6 px-1">
                            Recent commentary from leading institutions highlights growing investor interest in private credit
                            <span className="hidden sm:inline"> — </span>
                            <span className="block sm:inline mt-1 sm:mt-0">
                                <a className="text-gold underline" href="https://privatebank.jpmorgan.com/latam/en/insights/markets-and-investing/why-private-credit-remains-a-strong-opportunity" target="_blank" rel="noreferrer">J.P. Morgan (2025)</a>
                                <span className="mx-2">·</span>
                                <a className="text-gold underline" href="https://www.blackrock.com/corporate/newsroom/press-releases/article/corporate-one/press-releases/blackrock-family-office-survey-2025" target="_blank" rel="noreferrer">BlackRock (2025)</a>
                                <span className="mx-2">·</span>
                                <a className="text-gold underline" href="https://rcmbrand.rockco.com/The%20Long%20and%20Short%20of%20It%20-%20Private%20Credit%20February%202024.pdf" target="_blank" rel="noreferrer">Rockefeller (2024)</a>
                            </span>
                        </div>
                        <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-3 md:gap-4 mb-6 sm:mb-8">
                            <button
                                onClick={() => setView('deck')}
                                className={`w-full xs:w-auto px-4 md:px-6 py-2.5 md:py-3 rounded-lg border text-sm md:text-base font-medium transition-all ${view === 'deck' ? 'bg-gold text-background border-gold' : 'bg-accent text-text-secondary border-graphite hover:border-gold/50'}`}
                            >
                                Pitch Deck
                            </button>
                            <button
                                onClick={() => setView('onepager')}
                                className={`w-full xs:w-auto px-4 md:px-6 py-2.5 md:py-3 rounded-lg border text-sm md:text-base font-medium transition-all ${view === 'onepager' ? 'bg-gold text-background border-gold' : 'bg-accent text-text-secondary border-graphite hover:border-gold/50'}`}
                            >
                                One-Pager
                            </button>
                        </div>

                        <div className="bg-surface border border-graphite rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                            {view === 'deck' ? (
                                <div>
                                    <div className="max-w-4xl mx-auto mb-4 sm:mb-6 text-center px-2">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-1 sm:mb-2">Investment Pitch Deck</h2>
                                        <p className="text-sm sm:text-base text-text-secondary">Click any page to view fullscreen. No password or login required.</p>
                                    </div>
                                    <PitchDeckContent />
                                </div>
                            ) : (
                                <div className="max-w-5xl mx-auto">
                                    <div className="max-w-3xl mx-auto mb-4 sm:mb-6 text-center px-2">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-1 sm:mb-2">One-Pager</h2>
                                        <p className="text-sm sm:text-base text-text-secondary">Inline preview below. Click the image to view fullscreen within the site.</p>
                                    </div>
                                    <div className="bg-accent border border-graphite rounded-lg sm:rounded-xl p-0 overflow-hidden">
                                        <img
                                            src={onePagerUrl}
                                            alt="Inner Circle Lending One-Pager"
                                            className="w-full h-auto rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl cursor-zoom-in"
                                            onClick={() => {
                                                setOnePagerOpen(true);
                                                document.body.style.overflow = 'hidden';
                                            }}
                                        />
                                    </div>
                                    {/* Fullscreen One-Pager Modal */}
                                    {onePagerOpen && (
                                        <div
                                            ref={modalRef}
                                            className="fixed inset-0 bg-black/90 z-[60] overflow-auto"
                                            onClick={(e) => {
                                                if (e.target === modalRef.current) {
                                                    setOnePagerOpen(false);
                                                    document.body.style.overflow = 'auto';
                                                }
                                            }}
                                        >
                                            <div className="fixed top-0 left-0 right-0 p-3 sm:p-4 bg-black/80 backdrop-blur-sm flex justify-end items-center z-[70] border-b border-white/10">
                                                <button
                                                    onClick={() => {
                                                        setOnePagerOpen(false);
                                                        document.body.style.overflow = 'auto';
                                                    }}
                                                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/20 hover:bg-red-500/30 rounded-md sm:rounded-lg text-white transition-colors text-sm sm:text-base font-medium border border-red-500/30"
                                                >
                                                    ✕ Close
                                                </button>
                                            </div>

                                            <div className="pt-20 sm:pt-24 p-3 sm:p-8 flex flex-col items-center justify-center min-h-screen">
                                                <img
                                                    src={onePagerUrl}
                                                    alt="Inner Circle Lending One-Pager Fullscreen"
                                                    className="max-w-[95vw] md:max-w-5xl w-auto h-auto max-h-[80vh] sm:max-h-[85vh] rounded-md sm:rounded-lg shadow-2xl object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Documents;
