import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

const EmailContact: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if script is already loaded to prevent duplicates
        const existingScript = document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]');

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://link.msgsndr.com/js/form_embed.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    return (
        <div className="min-h-screen bg-black text-white pt-16">
            <div className="container mx-auto px-6 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <Mail className="w-6 h-6 text-yellow-500" />
                        <h1 className="text-2xl font-bold text-white">Contact Us</h1>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-lg text-gray-300">
                        Send us a message and we'll get back to you as soon as possible.
                    </p>
                </div>

                {/* LeadConnector Form Embed - Seamless Integration */}
                <div className="w-full">
                    <iframe
                        src="https://api.leadconnectorhq.com/widget/form/672F7WVRP5znSmIf35ts"
                        style={{
                            width: '100%',
                            height: '866px',
                            border: 'none',
                            background: 'transparent'
                        }}
                        frameBorder="0"
                        scrolling="no"
                        id="inline-672F7WVRP5znSmIf35ts"
                        data-layout="{'id':'INLINE'}"
                        data-trigger-type="alwaysShow"
                        data-trigger-value=""
                        data-activation-type="alwaysActivated"
                        data-activation-value=""
                        data-deactivation-type="neverDeactivate"
                        data-deactivation-value=""
                        data-form-name="ICL Email"
                        data-height="866"
                        data-layout-iframe-id="inline-672F7WVRP5znSmIf35ts"
                        data-form-id="672F7WVRP5znSmIf35ts"
                        title="ICL Email"
                    />
                </div>
            </div>
        </div>
    );
};

export default EmailContact;
