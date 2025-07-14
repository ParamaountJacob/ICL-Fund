import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Transform values for parallax effect
  const y = useTransform(scrollY, [0, 800], [0, -200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 800], [1, 1.1]);

  return (
    <motion.section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ position: 'fixed', width: '100%', top: 0, zIndex: 1 }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={{ scale }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60 grayscale"
        >
          <source src="https://cdn.shopify.com/videos/c/o/v/0a657f7363044727af7cfa2d4bdfeeb0.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 backdrop-blur-sm"></div>
      </motion.div>

      {/* Centered Logo */}
      <motion.div
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30"
        style={{ y, opacity }}
      >
        <div className="flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
            alt="Inner Circle Lending"
            className="h-6 w-auto"
          />
          <span className="text-white font-light text-lg tracking-wide">INNERCIRCLE</span>
        </div>
      </motion.div>

      {/* Hero Text */}
      <motion.div
        className="relative z-20 text-center px-6"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-light text-white leading-tight tracking-wide">
            Engineered
          </h1>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-light text-gold leading-tight tracking-wide mt-2">
            for Privacy
          </h1>
        </motion.div>

        {/* Scroll indicator - positioned to be visible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;