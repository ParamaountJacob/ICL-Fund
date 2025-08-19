import React from 'react';
import { motion } from 'framer-motion';
import PitchDeckContent from '../components/PitchDeckContent';

const PitchDeck: React.FC = () => {
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
            <PitchDeckContent />
          </div>
        </div>
      </section>
    </div>
  );
};

export default PitchDeck;