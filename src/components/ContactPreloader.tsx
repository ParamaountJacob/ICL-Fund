import React, { useEffect } from 'react';

/**
 * Preloads contact form iframes in the background for instant loading
 * when users navigate to contact pages
 */
const ContactPreloader: React.FC = () => {
    useEffect(() => {
        // Load the LeadConnector script once globally
        const existingScript = document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]');

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://link.msgsndr.com/js/form_embed.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    return (
        <div style={{ display: 'none' }} aria-hidden="true">
            {/* Preload Email Contact Form */}
            <iframe
                src="https://api.leadconnectorhq.com/widget/form/672F7WVRP5znSmIf35ts"
                style={{
                    width: '1px',
                    height: '1px',
                    border: 'none',
                    position: 'absolute',
                    left: '-9999px'
                }}
                title="Email Contact Preload"
                tabIndex={-1}
            />

            {/* Preload Video Call Booking */}
            <iframe
                src="https://api.leadconnectorhq.com/widget/booking/Zp3dkGUPA56lYxTr5NCw"
                style={{
                    width: '1px',
                    height: '1px',
                    border: 'none',
                    position: 'absolute',
                    left: '-9999px'
                }}
                title="Video Booking Preload"
                tabIndex={-1}
            />

            {/* Preload Phone Call Booking */}
            <iframe
                src="https://api.leadconnectorhq.com/widget/booking/ArouErFpNGMUDeiiUv5k"
                style={{
                    width: '1px',
                    height: '1px',
                    border: 'none',
                    position: 'absolute',
                    left: '-9999px'
                }}
                title="Phone Booking Preload"
                tabIndex={-1}
            />
        </div>
    );
};

export default ContactPreloader;
