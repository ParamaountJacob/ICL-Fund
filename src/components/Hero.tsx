import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Transform values for parallax effect - optimized for desktop and mobile
  const y = useTransform(scrollY, [0, 800], [0, -200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 800], [1, 1.1]);
  const blurOverlay = useTransform(scrollY, [0, 300], [0, 1]);

  return (
    <motion.section
      id="home"
      className="h-screen flex items-center justify-center relative overflow-hidden"
      style={{ position: 'fixed', width: '100%', height: '100vh', top: 0, zIndex: 1 }}
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
          style={{ minHeight: '100vh', minWidth: '100vw' }}
        >
          <source src="https://cdn.shopify.com/videos/c/o/v/0a657f7363044727af7cfa2d4bdfeeb0.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40"></div>
        <motion.div
          className="absolute inset-0 backdrop-blur-sm bg-black/20"
          style={{ opacity: blurOverlay }}
        ></motion.div>
      </motion.div>

      {/* Bigger Centered Logo - positioned lower and more prominent */}
      <motion.div
        className="absolute top-16 md:top-20 w-full z-30 flex justify-center"
        style={{
          y: useTransform(scrollY, [0, 600], [0, -80]),
          opacity: useTransform(scrollY, [0, 500], [1, 0]),
          scale: useTransform(scrollY, [0, 600], [1, 0.6])
        }}
      >
        <div className="flex items-center justify-center gap-4 md:gap-5">
          <img
            src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
            alt="Inner Circle Lending"
            className="h-10 md:h-12 lg:h-14 w-auto"
          />
          <span className="text-white font-thin text-2xl md:text-3xl lg:text-4xl tracking-widest">INNERCIRCLE</span>
        </div>
      </motion.div>

      {/* Hero Text - More compelling and dynamic */}
      <motion.div
        className="relative z-20 text-center px-4 md:px-6 mt-8 md:mt-12"
        style={{
          y,
          opacity,
          scale: useTransform(scrollY, [0, 400], [1, 1.05])
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-5xl md:text-7xl lg:text-9xl xl:text-[12rem] font-thin text-white leading-[0.9] tracking-wider drop-shadow-2xl mb-2 md:mb-4"
            animate={{
              textShadow: ["0 0 20px rgba(255,255,255,0.3)", "0 0 40px rgba(255,255,255,0.5)", "0 0 20px rgba(255,255,255,0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            The Power
          </motion.h1>
          <motion.h1
            className="text-5xl md:text-7xl lg:text-9xl xl:text-[12rem] font-thin text-gold leading-[0.9] tracking-wider drop-shadow-2xl"
            animate={{
              textShadow: ["0 0 20px rgba(218,165,32,0.4)", "0 0 40px rgba(218,165,32,0.6)", "0 0 20px rgba(218,165,32,0.4)"]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          >
            of Certainty
          </motion.h1>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;