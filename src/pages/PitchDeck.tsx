import React, { useState, useRef } from 'react';
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
    <div className="pt-20">
      <section className="py-24 md:py-32">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto mb-16 text-center"
          >
            <h1 className="heading-xl mb-8">Investment Pitch Deck</h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              Comprehensive overview of our investment strategy and returns.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      {modalIsOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black/90 z-50 overflow-auto"
          onClick={(e) => {
            if (e.target === modalRef.current) {
              setModalIsOpen(false);
              document.body.style.overflow = 'auto';
            }
          }}
        >
          <div className="sticky top-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm flex justify-between items-center">
            <button
              onClick={() => setModalIsHorizontal(!modalIsHorizontal)}
              className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              {modalIsHorizontal ? 'Switch to Vertical' : 'Switch to Horizontal'}
            </button>
            <button
              onClick={() => {
                setModalIsOpen(false);
                document.body.style.overflow = 'auto';
              }}
              className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              Exit Fullscreen
            </button>
          </div>

          <div className={`p-8 flex ${modalIsHorizontal ? 'flex-row overflow-x-auto' : 'flex-col'} items-center justify-center min-h-[calc(100vh-80px)]`}>
            {images.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Pitch Deck Page ${index + 1}`}
                className={`
                  ${modalIsHorizontal ? 'mr-8 last:mr-0 max-h-[80vh]' : 'mb-8 last:mb-0'}
                  max-w-[95vw] md:max-w-4xl w-auto h-auto rounded-lg shadow-2xl object-contain
                  ${modalIsHorizontal ? 'h-[80vh]' : 'max-h-[85vh]'}
                `}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PitchDeck: React.FC = () => {
  return <PitchDeckContent />;
};

export default PitchDeck;