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
              Invest Money You Didn't Know You Could
            </h1>
            <p className="text-2xl md:text-3xl text-text-secondary leading-relaxed max-w-4xl mx-auto">
              Turn your hidden assets into a steady income stream. We help you unlock funds from dormant 401(k)s, 
              tax payments, or crypto holdings and put them to work earning 11-15% fixed returns.
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
              <h3 className="text-lg font-semibold mb-2">Retirement Accounts</h3>
              <p className="text-text-secondary">
                Self-direct your 401(k) or IRA into high-yield investments while keeping tax benefits.
              </p>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-sm p-6 rounded-lg border border-graphite">
              <CircleDollarSign className="w-8 h-8 text-gold mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tax Payments</h3>
              <p className="text-text-secondary">
                Transform your tax burden into an investment opportunity with IRS-approved strategies.
              </p>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-sm p-6 rounded-lg border border-graphite">
              <Wallet className="w-8 h-8 text-gold mb-4" />
              <h3 className="text-lg font-semibold mb-2">Crypto Holdings</h3>
              <p className="text-text-secondary">
                Put your idle crypto to work generating consistent monthly income.
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
              Find My Hidden Funds
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