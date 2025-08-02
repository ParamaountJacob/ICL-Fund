import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const VideoCallBooking: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Load the form embed script
        const script = document.createElement('script');
        script.src = 'https://link.msgsndr.com/js/form_embed.js';
        script.type = 'text/javascript';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Clean up script on unmount
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header with back button */}
            <div className="p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-6 pb-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">Schedule Your Video Call</h1>
                    <p className="text-xl text-gray-300">
                        Face-to-face consultation with screen sharing - Same day availability
                    </p>
                </div>

                {/* Booking embed */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                        <iframe
                            src="https://api.leadconnectorhq.com/widget/booking/Zp3dkGUPA56lYxTr5NCw"
                            style={{
                                width: '100%',
                                border: 'none',
                                overflow: 'hidden',
                                minHeight: '600px'
                            }}
                            scrolling="no"
                            id="Zp3dkGUPA56lYxTr5NCw_1754087690502"
                            title="Video Call Booking"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCallBooking;
