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
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-light mb-4 text-white leading-tight">
              11-15% Fixed Returns
            </h1>
            <p className="text-lg md:text-xl text-gold font-medium mb-8">
              Engineered for Privacy
            </p>

            <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-4">
              For accredited investors seeking predictable returns independent of market volatility.
            </p>

            <p className="text-base md:text-lg text-text-secondary/90 leading-relaxed max-w-3xl mx-auto">
              Turn your tax liability into a yield-generating asset. We help you unlock funds from dormant 401(k)s, tax payments, or crypto holdings and deploy them strategically across short-term, secured business loans.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            <div className="bg-surface/30 backdrop-blur-sm p-5 rounded-lg border border-graphite/50">
              <FileText className="w-7 h-7 text-gold mb-3" />
              <h3 className="text-base font-semibold mb-2">Self-Directed Retirement</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Direct 401(k)/IRA funds into high-yield investments while keeping tax benefits.
              </p>
            </div>

            <div className="bg-surface/30 backdrop-blur-sm p-5 rounded-lg border border-graphite/50">
              <CircleDollarSign className="w-7 h-7 text-gold mb-3" />
              <h3 className="text-base font-semibold mb-2">Tax Repositioning</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Transform tax payments into investment opportunities with IRS-approved strategies.
              </p>
            </div>

            <div className="bg-surface/30 backdrop-blur-sm p-5 rounded-lg border border-graphite/50">
              <Wallet className="w-7 h-7 text-gold mb-3" />
              <h3 className="text-base font-semibold mb-2">Crypto Income Stream</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Convert volatile crypto holdings into steady monthly income.
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