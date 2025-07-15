import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Transform values for parallax effect - optimized for desktop and mobile with conservative scaling
  const y = useTransform(scrollY, [0, 800], [0, -200]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0]); // Fade out later
  const scale = useTransform(scrollY, [0, 800], [1, 1.05]); // Reduced scale to prevent overflow
  const blurOverlay = useTransform(scrollY, [0, 300], [0, 1]);

  return (
    <motion.section
      id="home"
      className="h-screen flex items-center justify-center relative overflow-hidden"
      style={{ position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0, zIndex: 1, willChange: 'transform' }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={{ scale, willChange: 'transform' }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{ minHeight: '100vh', minWidth: '100vw', maxWidth: '100vw' }}
        >
          <source src="https://res.cloudinary.com/digjsdron/video/upload/v1752590378/Homescreen_q1odxc.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45"></div>
        <motion.div
          className="absolute inset-0 backdrop-blur-sm bg-black/20"
          style={{ opacity: blurOverlay }}
        ></motion.div>
      </motion.div>

      {/* Logo - positioned higher on mobile, fades in after main text */}
      <motion.div
        className="absolute top-8 md:top-16 w-full z-30 flex justify-center"
        style={{
          y: useTransform(scrollY, [0, 600], [0, -80]),
          opacity: useTransform(scrollY, [0, 500], [1, 0]),
          scale: useTransform(scrollY, [0, 600], [1, 0.6]),
          willChange: 'transform'
        }}
      >
        <motion.div
          className="flex items-center justify-center gap-4 md:gap-5"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 2.0, delay: 1.1, ease: "easeOut" }}
        >
          <img
            src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
            alt="Inner Circle Lending"
            className="h-8 md:h-10 lg:h-11 w-auto"
          />
          <span className="text-white font-thin text-xl md:text-2xl lg:text-3xl tracking-widest">INNERCIRCLE</span>
        </motion.div>
      </motion.div>

      {/* Hero Text - Appears immediately, perfect mobile size, smaller desktop */}
      <motion.div
        className="relative z-20 text-center px-4 md:px-6 -mt-12 md:-mt-16 w-full max-w-7xl mx-auto"
        style={{
          y,
          opacity,
          scale: useTransform(scrollY, [0, 400], [1, 1.02]),
          willChange: 'transform'
        }}
      >
        <div className="overflow-hidden">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-thin text-white leading-[0.9] tracking-wide md:tracking-wider drop-shadow-2xl mb-2 md:mb-3"
          >
            The Power
          </h1>
          <h1
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-thin text-gold leading-[0.9] tracking-wide md:tracking-wider drop-shadow-2xl"
          >
            of Certainty
          </h1>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;