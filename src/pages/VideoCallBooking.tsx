import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';

const VideoCallBooking: React.FC = () => {
    const navigate = useNavigate();

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

        // No cleanup needed since script should persist across page navigation
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

                {/* Booking embed */}
                <div className="bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                    <iframe
                        src="https://api.leadconnectorhq.com/widget/booking/Zp3dkGUPA56lYxTr5NCw"
                        style={{
                            width: '100%',
                            border: 'none',
                            overflow: 'hidden',
                            minHeight: '600px',
                            background: 'black'
                        }}
                        scrolling="no"
                        id="Zp3dkGUPA56lYxTr5NCw_1754087690502"
                        title="Video Call Booking"
                    />
                </div>
            </div>
        </div>
    );
};

export default VideoCallBooking;
