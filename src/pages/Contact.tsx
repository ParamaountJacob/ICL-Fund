import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Video, Phone } from 'lucide-react';

const Contact: React.FC = () => {
  const handleContactClick = (type: string) => {
    const formIds = {
      email: '672F7WVRP5znSmIf35ts',
      video: 'Zp3dkGUPA56lYxTr5NCw',
      phone: 'ArouErFpNGMUDeiiUv5k'
    };

    const formId = formIds[type as keyof typeof formIds];
    if (formId) {
      window.open(`https://iclcapitalfund.leadconnectorhq.com/widget/form/${formId}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Choose how you'd like to connect with our team
          </p>
        </motion.div>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            {/* Email Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-xl p-8 border border-graphite hover:border-gold/50 transition-all duration-300 cursor-pointer group hover:bg-gold/5"
              onClick={() => handleContactClick('email')}
            >
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-all duration-300">
                <Mail className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 mt-4">Email Us</h3>
              <p className="text-text-secondary mb-4">Send us a message and we'll get back to you within 24 hours.</p>
              <div className="text-gold font-medium group-hover:text-gold/80">
                Get Started →
              </div>
            </motion.div>

            {/* Video Call */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface rounded-xl p-8 border border-gold/20 hover:border-gold/40 transition-all duration-300 cursor-pointer group hover:bg-gold/5 relative"
              onClick={() => handleContactClick('video')}
            >
              {/* Golden frame effect for center card */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-all duration-300">
                  <Video className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2 mt-4">Video Call</h3>
                <p className="text-text-secondary mb-4">Schedule a face-to-face meeting to discuss your needs in detail.</p>
                <div className="text-gold font-medium group-hover:text-gold/80">
                  Schedule Now →
                </div>
              </div>
            </motion.div>

            {/* Phone Call */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface rounded-xl p-8 border border-graphite hover:border-gold/50 transition-all duration-300 cursor-pointer group hover:bg-gold/5"
              onClick={() => handleContactClick('phone')}
            >
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-all duration-300">
                <Phone className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 mt-4">Phone Call</h3>
              <p className="text-text-secondary mb-4">Speak directly with our team for immediate assistance.</p>
              <div className="text-gold font-medium group-hover:text-gold/80">
                Call Now →
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
