import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CircleDollarSign, FileText, Wallet } from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="min-h-[90vh] pt-20 md:pt-28 pb-8 md:pb-16 flex items-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10"></div>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-50 grayscale"
        >
          <source src="https://cdn.shopify.com/videos/c/o/v/0a657f7363044727af7cfa2d4bdfeeb0.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="section relative z-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-16 text-center"
          >
            <h1 className="heading-xl mb-8">
              11-15% Fixed-Income Returns, Engineered for Privacy
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-4xl mx-auto mb-6">
              For accredited investors seeking consistent, predictable returns independent of market volatility.
            </p>
            <p className="text-lg md:text-xl text-text-secondary/80 leading-relaxed max-w-3xl mx-auto">
              Turn your tax liability into a yield-generating asset. We help you unlock funds from dormant 401(k)s,
              tax payments, or crypto holdings and deploy them strategically across short-term, secured business loans.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            <div className="bg-surface/50 backdrop-blur-sm p-6 rounded-lg border border-graphite">
              <FileText className="w-8 h-8 text-gold mb-4" />
              <h3 className="text-lg font-semibold mb-2">Self-Directed Retirement</h3>
              <p className="text-text-secondary">
                Self-direct your 401(k) or IRA into high-yield investments while keeping tax benefits.
              </p>
            </div>

            <div className="bg-surface/50 backdrop-blur-sm p-6 rounded-lg border border-graphite">
              <CircleDollarSign className="w-8 h-8 text-gold mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tax Repositioning</h3>
              <p className="text-text-secondary">
                Transform your tax burden into an investment opportunity with IRS-approved strategies.
              </p>
            </div>

            <div className="bg-surface/50 backdrop-blur-sm p-6 rounded-lg border border-graphite">
              <Wallet className="w-8 h-8 text-gold mb-4" />
              <h3 className="text-lg font-semibold mb-2">Crypto Income Stream</h3>
              <p className="text-text-secondary">
                Convert volatile crypto holdings into steady monthly income through secured lending.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/contact', { state: { consultation: true } })}
              className="button"
            >
              Schedule Free Consultation
            </button>
            <a href="#process" className="button-gold">
              How It Works
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;