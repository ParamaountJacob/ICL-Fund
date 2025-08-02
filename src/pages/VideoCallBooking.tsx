import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';

const VideoCallBooking: React.FC = () => {
    const navigate = useNavigate();
    const [iframeHeight, setIframeHeight] = useState(600);

    useEffect(() => {
        // Check if script is already loaded to prevent duplicates
        const existingScript = document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]');

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://link.msgsndr.com/js/form_embed.js';
            script.type = 'text/javascript';
            script.async = true;
            script.setAttribute('data-booking-component', 'video');
            document.head.appendChild(script);
        }

        // Inject CSS to make iframes seamless
        const style = document.createElement('style');
        style.textContent = `
            iframe[src*="leadconnectorhq.com"] {
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }
            
            /* Hide scrollbars in iframe content */
            iframe[src*="leadconnectorhq.com"]::-webkit-scrollbar {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        // Listen for iframe height changes
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://api.leadconnectorhq.com') return;

            if (event.data && event.data.type === 'resize' && event.data.height) {
                setIframeHeight(event.data.height);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            document.head.removeChild(style);
        };
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
                        <Video className="w-6 h-6 text-yellow-500" />
                        <h1 className="text-2xl font-bold text-white">Video Call Booking</h1>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-lg text-gray-300">
                        Face-to-face consultation with screen sharing - Same day availability
                    </p>
                </div>

                {/* Booking embed - Seamless Integration */}
                <div className="w-full">
                    <iframe
                        src="https://api.leadconnectorhq.com/widget/booking/Zp3dkGUPA56lYxTr5NCw"
                        style={{
                            width: '100%',
                            height: `${iframeHeight}px`,
                            border: 'none',
                            margin: 0,
                            padding: 0,
                            background: 'transparent',
                            display: 'block',
                            colorScheme: 'dark'
                        }}
                        frameBorder="0"
                        scrolling="no"
                        seamless
                        id="Zp3dkGUPA56lYxTr5NCw_1754087690502"
                        title="Video Call Booking"
                        onLoad={(e) => {
                            const iframe = e.target as HTMLIFrameElement;
                            // Try to get actual content height
                            try {
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                                if (iframeDoc) {
                                    const body = iframeDoc.body;
                                    const html = iframeDoc.documentElement;
                                    const height = Math.max(
                                        body?.scrollHeight || 0,
                                        body?.offsetHeight || 0,
                                        html?.clientHeight || 0,
                                        html?.scrollHeight || 0,
                                        html?.offsetHeight || 0
                                    );
                                    if (height > 0) setIframeHeight(height);
                                }
                            } catch (e) {
                                // Cross-origin restrictions, fallback to postMessage
                                console.log('Using postMessage for iframe height adjustment');
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default VideoCallBooking;
