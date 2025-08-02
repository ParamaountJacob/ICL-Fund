import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';

const PhoneCallBooking: React.FC = () => {
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
                        <Phone className="w-6 h-6 text-yellow-500" />
                        <h1 className="text-2xl font-bold text-white">Phone Call Booking</h1>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-lg text-gray-300">
                        Direct phone consultation for focused discussion - 3-4 hours availability
                    </p>
                </div>

                {/* Booking embed */}
                <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                    <iframe
                        src="https://api.leadconnectorhq.com/widget/booking/ArouErFpNGMUDeiiUv5k"
                        style={{
                            width: '100%',
                            border: 'none',
                            overflow: 'hidden',
                            minHeight: '600px'
                        }}
                        scrolling="no"
                        id="ArouErFpNGMUDeiiUv5k_1754087680510"
                        title="Phone Call Booking"
                    />
                </div>
            </div>
        </div>
    );
};

export default PhoneCallBooking;
