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

      {/* Centered Logo - will transform to navbar slowly */}
      <motion.div
        className="absolute top-8 w-full z-30 flex justify-center"
        style={{
          y: useTransform(scrollY, [0, 600], [0, -60]),
          opacity: useTransform(scrollY, [0, 500], [1, 0]),
          scale: useTransform(scrollY, [0, 600], [1, 0.7])
        }}
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
        className="relative z-20 text-center px-4 md:px-6"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-thin text-white leading-tight tracking-wider drop-shadow-2xl">
            The Power
          </h1>
          <h1 className="text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-thin text-gold leading-tight tracking-wider mt-2 md:mt-4 drop-shadow-2xl">
            of Certainty
          </h1>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;