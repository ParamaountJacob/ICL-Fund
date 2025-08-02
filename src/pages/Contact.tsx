import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Video, Phone, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Contact: React.FC = () => {
  const navigate = useNavigate();

  const contactMethods = [
    {
      id: 'email',
      title: 'Email',
      subtitle: 'Send us a detailed message about your investment goals',
      timing: '1-2 days',
      icon: Mail,
      iconColor: 'text-yellow-500',
      path: '/email-contact'
    },
    {
      id: 'video',
      title: 'Video Call',
      subtitle: 'Face-to-face consultation with screen sharing',
      timing: 'Same day',
      icon: Video,
      iconColor: 'text-yellow-500',
      path: '/video-call-booking'
    },
    {
      id: 'phone',
      title: 'Phone Call',
      subtitle: 'Direct phone consultation for focused discussion',
      timing: '3-4 hours',
      icon: Phone,
      iconColor: 'text-yellow-500',
      path: '/phone-call-booking'
    }
  ];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose how you'd like to connect with our team
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-6">
          {contactMethods.map((method, index) => (
            <motion.button
              key={method.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => navigate(method.path)}
              className="w-full group"
            >
              <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-8 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-300">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center">
                      <method.icon className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      {method.title}
                    </h3>
                    <p className="text-gray-400 text-lg mb-3 leading-relaxed">
                      {method.subtitle}
                    </p>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{method.timing}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contact;
