// src/pages/PPM.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Shield, Edit, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PPM: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      // A simple check to see if the user is an admin.
      // In a real app, you would use the more robust role check from the database.
      setIsAdmin(user?.email === 'innercirclelending@gmail.com');
    });
  }, []);

  return (
    <div className="pt-20">
      <section className="py-24 md:py-32">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto mb-16 text-center"
          >
            <h1 className="heading-xl mb-8">PPM & Subscription Agreement</h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              Access our Private Placement Memorandum and subscription agreement details.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-surface p-12 mb-12"
            >
              <div className="flex items-center mb-8">
                <FileCheck className="w-12 h-12 text-gold mr-6" />
                <div>
                  <h2 className="heading mb-2">PPM Documents</h2>
                  <p className="text-text-secondary">
                    Complete documentation for investment participation
                  </p>
                </div>
              </div>
              
              <div className="space-y-6 text-text-secondary mb-8">
                <p>Our PPM package includes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Private Placement Memorandum</li>
                  <li>Subscription Agreement</li>
                  <li>Investment Terms & Conditions</li>
                  <li>Risk Disclosures</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <Link 
                  to="/ppm/view"
                  className="button flex items-center justify-center gap-2 w-full"
                >
                  <FileText className="w-5 h-5" />
                  View Documents
                </Link>
                {isAdmin && (
                  <Link 
                    to="/ppm/edit"
                    className="button-gold flex items-center justify-center gap-2 w-full"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Documents
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PPM;