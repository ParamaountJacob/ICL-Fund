import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, ExternalLink, FileSignature } from 'lucide-react';

interface SignedDocument {
    id: string;
    document_type: string;
    status: string;
    document_url?: string;
    created_at: string;
}

interface DocumentStatusPanelProps {
    signedDocuments: SignedDocument[];
    loadingDocuments: boolean;
}

export const DocumentStatusPanel: React.FC<DocumentStatusPanelProps> = ({
    signedDocuments,
    loadingDocuments
}) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'signed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'investor_signed':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'signed':
                return 'Fully signed';
            case 'investor_signed':
                return 'Awaiting admin signature';
            default:
                return 'In progress';
        }
    };

    const getDocumentDisplayName = (type: string) => {
        switch (type) {
            case 'subscription_agreement':
                return 'Subscription Agreement';
            case 'promissory_note':
                return 'Promissory Note';
            default:
                return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    if (loadingDocuments) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-card rounded-lg p-6 border border-card-border"
            >
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                    <FileSignature className="w-5 h-5 mr-2 text-gold" />
                    Document Status
                </h3>
                <div className="animate-pulse space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                                <div>
                                    <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
                                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card rounded-lg p-6 border border-card-border"
        >
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center">
                <FileSignature className="w-5 h-5 mr-2 text-gold" />
                Document Status
            </h3>

            <div className="space-y-4">
                {signedDocuments.length > 0 ? (
                    signedDocuments.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 bg-background rounded-lg border border-card-border"
                        >
                            <div className="flex items-center">
                                <div className="p-2 bg-gold/10 rounded-lg mr-3">
                                    {getStatusIcon(doc.status)}
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary">
                                        {getDocumentDisplayName(doc.document_type)}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {getStatusText(doc.status)}
                                    </p>
                                </div>
                            </div>

                            {doc.document_url && (
                                <a
                                    href={doc.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gold hover:text-gold/80 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <FileSignature className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                        <p className="text-text-secondary">No signed documents yet</p>
                        <p className="text-text-tertiary text-sm">
                            Documents will appear here once you begin the investment process
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
