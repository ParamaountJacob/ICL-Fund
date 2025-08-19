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
        <div className="pt-20">
            <section className="py-24 md:py-32">
                <div className="section">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto mb-10 md:mb-14 text-center"
                    >
                        <h1 className="heading-xl mb-4">Investor Documents</h1>
                        <p className="text-lg md:text-xl text-text-secondary">Access our Pitch Deck and One-Pager without logging in.</p>
                    </motion.div>

                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-center gap-3 md:gap-4 mb-10">
                            <button
                                onClick={() => setView('deck')}
                                className={`px-4 md:px-6 py-2.5 md:py-3 rounded-lg border text-sm md:text-base font-medium transition-all ${view === 'deck' ? 'bg-gold text-background border-gold' : 'bg-accent text-text-secondary border-graphite hover:border-gold/50'}`}
                            >
                                Pitch Deck
                            </button>
                            <button
                                onClick={() => setView('onepager')}
                                className={`px-4 md:px-6 py-2.5 md:py-3 rounded-lg border text-sm md:text-base font-medium transition-all ${view === 'onepager' ? 'bg-gold text-background border-gold' : 'bg-accent text-text-secondary border-graphite hover:border-gold/50'}`}
                            >
                                One-Pager
                            </button>
                        </div>

                        <div className="bg-surface border border-graphite rounded-xl md:rounded-2xl p-4 md:p-6">
                            {view === 'deck' ? (
                                <div>
                                    <div className="max-w-4xl mx-auto mb-6 text-center">
                                        <h2 className="text-2xl md:text-3xl font-semibold mb-2">Investment Pitch Deck</h2>
                                        <p className="text-text-secondary">Click any page to view fullscreen. No password or login required.</p>
                                    </div>
                                    <PitchDeckContent />
                                </div>
                            ) : (
                                <div className="max-w-5xl mx-auto">
                                    <div className="max-w-3xl mx-auto mb-6 text-center">
                                        <h2 className="text-2xl md:text-3xl font-semibold mb-2">One-Pager</h2>
                                        <p className="text-text-secondary">Inline preview below. Click the image to view fullscreen within the site.</p>
                                    </div>
                                    <div className="bg-accent border border-graphite rounded-xl p-0">
                                        <img
                                            src={onePagerUrl}
                                            alt="Inner Circle Lending One-Pager"
                                            className="w-full h-auto rounded-xl shadow-xl cursor-zoom-in"
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
                                            <div className="fixed top-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm flex justify-end items-center z-[70] border-b border-white/10">
                                                <button
                                                    onClick={() => {
                                                        setOnePagerOpen(false);
                                                        document.body.style.overflow = 'auto';
                                                    }}
                                                    className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white transition-colors text-sm sm:text-base font-medium border border-red-500/30"
                                                >
                                                    ✕ Close
                                                </button>
                                            </div>

                                            <div className="pt-24 p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen">
                                                <img
                                                    src={onePagerUrl}
                                                    alt="Inner Circle Lending One-Pager Fullscreen"
                                                    className="max-w-[95vw] md:max-w-5xl w-auto h-auto max-h-[85vh] rounded-lg shadow-2xl object-contain"
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
