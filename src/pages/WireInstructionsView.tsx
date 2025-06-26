import React from 'react';
import { motion } from 'framer-motion';
import { Building2, CreditCard, Download, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { SuccessModal } from '../components/SuccessModal';

const WireInstructionsView: React.FC = () => {
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const opt = {
        margin: [0.5, 0.5],
        filename: 'wire-instructions.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          backgroundColor: '#0C0C0E'
        },
        jsPDF: { 
          unit: 'in',
          format: 'letter',
          orientation: 'portrait'
        }
      };
      
      await html2pdf().set(opt).from(element).save();
      setShowDownloadModal(true);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20">
      <section className="py-24 md:py-32">
        <div className="section">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="heading-xl">Wire Instructions</h1>
              <button 
                onClick={handleDownload}
                disabled={loading}
                className="button flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>

            <div ref={contentRef}>
            <div className="bg-surface p-8 rounded-lg mb-8">
              <div className="flex items-center gap-4 mb-8">
                <Building2 className="w-8 h-8 text-gold" />
                <h2 className="text-xl font-semibold">Bank Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm uppercase tracking-wide text-text-secondary mb-1">
                      Bank Name
                    </label>
                    <p className="text-lg">First National Bank</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm uppercase tracking-wide text-text-secondary mb-1">
                      Account Name
                    </label>
                    <p className="text-lg">Inner Circle Lending LLC</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm uppercase tracking-wide text-text-secondary mb-1">
                      Account Number
                    </label>
                    <p className="text-lg">1234567890</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm uppercase tracking-wide text-text-secondary mb-1">
                      Routing Number
                    </label>
                    <p className="text-lg">021000021</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm uppercase tracking-wide text-text-secondary mb-1">
                      SWIFT Code
                    </label>
                    <p className="text-lg">FNBAUS33</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm uppercase tracking-wide text-text-secondary mb-1">
                      Bank Address
                    </label>
                    <p className="text-lg">123 Financial Street, New York, NY 10004</p>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="bg-surface p-8 rounded-lg">
              <div className="flex items-center gap-4 mb-8">
                <CreditCard className="w-8 h-8 text-gold" />
                <div>
                  <h2 className="text-xl font-semibold">Wire Instructions</h2>
                  <p className="text-text-secondary">
                    Important information for your transfer
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-text-secondary">
                <p>Please include the following information with your wire transfer:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your full name as it appears on your investment documents</li>
                  <li>Your investment ID (if provided)</li>
                  <li>Reference: "ICL Investment"</li>
                </ul>
                
                <div className="bg-accent p-6 rounded-lg mt-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Important Notes</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Please notify us after completing your wire transfer</li>
                    <li>Funds typically clear within 1-2 business days</li>
                    <li>For questions, contact our investment team</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <SuccessModal
            isOpen={showDownloadModal}
            onClose={() => setShowDownloadModal(false)}
            title="Download Started"
            message="Your download of the wire instructions has started. The file will be saved to your downloads folder."
          />
        </div>
      </section>
    </div>
  );
};

export default WireInstructionsView;