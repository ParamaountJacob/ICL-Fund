import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';
import { getDocuments, downloadDocument, type Document } from '../lib/documents';
import { SuccessModal } from '../components/SuccessModal';

const PPMView: React.FC = () => {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [downloadingFile, setDownloadingFile] = React.useState('');

  React.useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments('ppm');
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      setDownloadingFile(doc.displayName);
      const { fileName, data } = await downloadDocument('ppm', doc.id);
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowDownloadModal(true);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="pt-20">
        <section className="py-24 md:py-32">
          <div className="section">
            <div className="text-center">Loading documents...</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <section className="py-24 md:py-32">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="heading-xl mb-8">PPM Documents</h1>
            <div className="space-y-6">
              {documents.map((doc, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-surface p-6 rounded-lg border border-graphite"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-gold" />
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{doc.displayName}</h3>
                        <p className="text-sm text-text-secondary">{doc.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        className="button px-4 py-2 flex items-center gap-2"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <SuccessModal
            isOpen={showDownloadModal}
            onClose={() => setShowDownloadModal(false)}
            title="Download Started"
            message={`Your download of "${downloadingFile}" has started. The file will be saved to your downloads folder.`}
          />
        </div>
      </section>
    </div>
  );
};

export default PPMView;