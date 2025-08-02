import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Video, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Contact: React.FC = () => {
  const navigate = useNavigate();

  const handleContactClick = (type: string) => {
    const routes = {
      email: '/email-contact',
      video: '/video-call-booking',
      phone: '/phone-call-booking'
    };

    const route = routes[type as keyof typeof routes];
    if (route) {
      navigate(route);
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

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Email Contact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onClick={() => handleContactClick('email')}
            className="w-full group cursor-pointer"
          >
            <div className="bg-surface border border-graphite rounded-xl p-8 hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-all duration-300">
                    <Mail className="w-8 h-8 text-gold" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-2xl font-semibold text-text-primary mb-2">
                    Email
                  </h3>
                  <p className="text-text-secondary text-lg mb-3 leading-relaxed">
                    Send us a detailed message about your investment goals
                  </p>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="text-sm">1-2 days</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Video Call */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => handleContactClick('video')}
            className="w-full group cursor-pointer"
          >
            <div className="bg-surface border border-graphite rounded-xl p-8 hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-all duration-300">
                    <Video className="w-8 h-8 text-gold" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-2xl font-semibold text-text-primary mb-2">
                    Video Call
                  </h3>
                  <p className="text-text-secondary text-lg mb-3 leading-relaxed">
                    Face-to-face consultation with screen sharing
                  </p>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="text-sm">Same day</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phone Call */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={() => handleContactClick('phone')}
            className="w-full group cursor-pointer"
          >
            <div className="bg-surface border border-graphite rounded-xl p-8 hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-all duration-300">
                    <Phone className="w-8 h-8 text-gold" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-2xl font-semibold text-text-primary mb-2">
                    Phone Call
                  </h3>
                  <p className="text-text-secondary text-lg mb-3 leading-relaxed">
                    Direct phone consultation for focused discussion
                  </p>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="text-sm">3-4 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
