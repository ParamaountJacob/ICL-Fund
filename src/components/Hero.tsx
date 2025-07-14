import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Transform values for parallax effect - slower transitions
  const y = useTransform(scrollY, [0, 1000], [0, -300]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);
  const scale = useTransform(scrollY, [0, 1000], [1, 1.2]);
  const blurOverlay = useTransform(scrollY, [0, 400], [0, 1]);

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
          className="w-full h-full object-cover"
        >
          <source src="https://cdn.shopify.com/videos/c/o/v/0a657f7363044727af7cfa2d4bdfeeb0.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40"></div>
        <motion.div
          className="absolute inset-0 backdrop-blur-sm bg-black/20"
          style={{ opacity: blurOverlay }}
        ></motion.div>
      </motion.div>

      {/* Centered Logo */}
      <motion.div
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30 w-full"
        style={{ y, opacity }}
      >
        <div className="flex items-center justify-center gap-3">
          <img
            src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
            alt="Inner Circle Lending"
            className="h-8 w-auto"
          />
          <span className="text-white font-thin text-xl tracking-widest">INNERCIRCLE</span>
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
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-thin text-white leading-tight tracking-wider drop-shadow-2xl">
            The Power
          </h1>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-thin text-gold leading-tight tracking-wider mt-4 drop-shadow-2xl">
            of Certainty
          </h1>
        </motion.div>

        {/* Scroll indicator - positioned right below the words */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-16 flex justify-center"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;