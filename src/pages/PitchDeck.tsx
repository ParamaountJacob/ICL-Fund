import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '../components/ProtectedRoute';

const PitchDeckContent: React.FC = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalIsHorizontal, setModalIsHorizontal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const images = [
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554838/Pitch_Deck-1_mxvdxw.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554838/Pitch_Deck-2_oxghtl.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554837/Pitch_Deck-3_qiugvc.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554839/Pitch_Deck-4_ibidvl.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554840/Pitch_Deck-5_svvlx9.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554839/Pitch_Deck-6_znaipy.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554840/Pitch_Deck-7_p9rodg.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554841/Pitch_Deck-8_y7mlnq.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554841/Pitch_Deck-9_fhgxao.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554842/Pitch_Deck-10_x2pbqm.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554842/Pitch_Deck-12_fvgywj.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554843/Pitch_Deck-13_xi2mvo.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554838/Pitch_Deck-14_isk4pn.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554837/Pitch_Deck-15_zfel13.png",
    "https://res.cloudinary.com/digjsdron/image/upload/v1746554840/Pitch_Deck-16_yboqg7.png"
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
  return (
    <ProtectedRoute>
      <PitchDeckContent />
    </ProtectedRoute>
  );
};

export default PitchDeck;