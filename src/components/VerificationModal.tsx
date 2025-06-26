import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationUrl: string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  verificationUrl
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Verification Document</h2>
          <div className="flex items-center space-x-2">
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in New Tab</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              src={verificationUrl}
              className="w-full h-full"
              title="Verification Document"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;