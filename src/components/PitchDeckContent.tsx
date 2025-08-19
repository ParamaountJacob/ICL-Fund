import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const PitchDeckContent: React.FC = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalIsHorizontal, setModalIsHorizontal] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const images = [
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052904/ICL_Read_Deck_-1_ezcgqs.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052904/ICL_Read_Deck_-2_upqyie.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052905/ICL_Read_Deck_-3_mzniim.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052904/ICL_Read_Deck_-4_ykdn8x.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052904/ICL_Read_Deck_-5_evc2n1.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052904/ICL_Read_Deck_-6_czib7e.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052904/ICL_Read_Deck_-7_g15pbq.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052905/ICL_Read_Deck_-8_hwpvr8.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052905/ICL_Read_Deck_-9_trckcq.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052905/ICL_Read_Deck_-10_d7vzhl.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052905/ICL_Read_Deck_-11_p7gydu.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052905/ICL_Read_Deck_-12_lik9sh.png",
        "https://res.cloudinary.com/digjsdron/image/upload/v1751052917/ICL_Read_Deck_-13_maf1eg.png"
    ];

    return (
        <div className="w-full">
            <div className="space-y-8 flex flex-col items-center">
                {images.map((src, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative max-w-4xl w-full"
                    >
                        <img
                            src={src}
                            alt={`Pitch Deck Page ${index + 1}`}
                            className="w-full h-auto rounded-lg shadow-xl cursor-pointer transition-transform hover:scale-[1.02] mx-auto"
                            onClick={() => {
                                setModalIsOpen(true);
                                document.body.style.overflow = 'hidden';
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {modalIsOpen && (
                <div
                    ref={modalRef}
                    className="fixed inset-0 bg-black/90 z-[60] overflow-auto"
                    onClick={(e) => {
                        if (e.target === modalRef.current) {
                            setModalIsOpen(false);
                            document.body.style.overflow = 'auto';
                        }
                    }}
                >
                    <div className="fixed top-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm flex justify-between items-center z-[70] border-b border-white/10">
                        <button
                            onClick={() => setModalIsHorizontal(!modalIsHorizontal)}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors text-sm sm:text-base font-medium"
                        >
                            {modalIsHorizontal ? 'Vertical View' : 'Horizontal View'}
                        </button>
                        <button
                            onClick={() => {
                                setModalIsOpen(false);
                                document.body.style.overflow = 'auto';
                            }}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white transition-colors text-sm sm:text-base font-medium border border-red-500/30"
                        >
                            ✕ Close
                        </button>
                    </div>

                    <div className={`pt-20 p-4 sm:p-8 flex ${modalIsHorizontal ? 'flex-row overflow-x-auto' : 'flex-col'} items-center justify-center min-h-screen`}>
                        {images.map((src, index) => (
                            <img
                                key={index}
                                src={src}
                                alt={`Pitch Deck Page ${index + 1}`}
                                className={`
                  ${modalIsHorizontal ? 'mr-4 sm:mr-8 last:mr-0 max-h-[80vh]' : 'mb-4 sm:mb-8 last:mb-0'}
                  max-w-[95vw] md:max-w-4xl w-auto h-auto rounded-lg shadow-2xl object-contain
                  ${modalIsHorizontal ? 'h-[75vh] sm:h-[80vh]' : 'max-h-[75vh] sm:max-h-[85vh]'}
                `}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PitchDeckContent;
