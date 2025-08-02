import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Video, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Contact: React.FC = () => {
  const navigate = useNavigate();

  const contactMethods = [
    {
      id: 'email',
      title: 'Email',
      subtitle: 'Send us a message',
      description: 'Get a detailed response within 24 hours',
      icon: Mail,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      path: '/email-contact'
    },
    {
      id: 'video',
      title: 'Video Call',
      subtitle: 'Face-to-face meeting',
      description: 'Screen sharing available - Same day booking',
      icon: Video,
      color: 'text-green-500',
      bg: 'bg-green-500/10 hover:bg-green-500/20',
      border: 'border-green-500/20 hover:border-green-500/40',
      path: '/video-call-booking'
    },
    {
      id: 'phone',
      title: 'Phone Call',
      subtitle: 'Direct conversation',
      description: 'Quick consultation - Available 3-4 hours daily',
      icon: Phone,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10 hover:bg-yellow-500/20',
      border: 'border-yellow-500/20 hover:border-yellow-500/40',
      path: '/phone-call-booking'
    }
  ];

  return (
    <div className="pt-16 min-h-screen bg-black">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-12"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Get in Touch</h1>
            <p className="text-base sm:text-lg text-gray-300">
              Choose how you'd like to connect with our team
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 max-w-2xl mx-auto">
            {contactMethods.map((method, index) => (
              <motion.button
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => navigate(method.path)}
                className={`w-full p-6 sm:p-8 ${method.bg} ${method.border} border-2 rounded-2xl transition-all duration-300 hover:scale-105 text-left group`}
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className={`p-3 sm:p-4 ${method.bg} rounded-xl`}>
                    <method.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${method.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl sm:text-2xl font-bold ${method.color} mb-2`}>
                      {method.title}
                    </h3>
                    <p className="text-white font-medium mb-2 text-base sm:text-lg">
                      {method.subtitle}
                    </p>
                    <p className="text-gray-400 text-sm sm:text-base">
                      {method.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">Need Help Choosing?</h2>
            <div className="text-gray-300 text-sm sm:text-base space-y-2">
              <p><strong className="text-blue-400">Email:</strong> Best for detailed questions or when you need documentation</p>
              <p><strong className="text-green-400">Video Call:</strong> Perfect for presentations, screen sharing, or complex discussions</p>
              <p><strong className="text-yellow-400">Phone Call:</strong> Ideal for quick questions or immediate consultation</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
