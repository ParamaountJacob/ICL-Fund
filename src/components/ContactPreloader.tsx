import React, { useEffect, useState } from 'react';

/**
 * Progressive loading: Waits for current page to fully load,
 * then gradually loads contact forms in background with controlled bandwidth usage
 */
const ContactPreloader: React.FC = () => {
    const [loadingPhase, setLoadingPhase] = useState<'waiting' | 'script' | 'email' | 'video' | 'phone' | 'complete'>('waiting');

    useEffect(() => {
        // Wait for current page to be fully loaded
        const startProgressiveLoading = () => {
            // Phase 1: Load the script first
            setTimeout(() => {
                setLoadingPhase('script');

                const existingScript = document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]');
                if (!existingScript) {
                    const script = document.createElement('script');
                    script.src = 'https://link.msgsndr.com/js/form_embed.js';
                    script.async = true;
                    document.head.appendChild(script);

                    script.onload = () => {
                        // Phase 2: Load email form after script loads
                        setTimeout(() => setLoadingPhase('email'), 1000);
                    };
                } else {
                    // Script already exists, move to email phase
                    setTimeout(() => setLoadingPhase('email'), 1000);
                }
            }, 500); // Small delay to ensure current page content is prioritized
        };

        // Check if page is already loaded
        if (document.readyState === 'complete') {
            startProgressiveLoading();
        } else {
            // Wait for page to finish loading
            window.addEventListener('load', startProgressiveLoading);
            return () => window.removeEventListener('load', startProgressiveLoading);
        }
    }, []);

    // Progressive phase transitions
    useEffect(() => {
        if (loadingPhase === 'email') {
            // Load video form after email form has time to initialize
            const timer = setTimeout(() => setLoadingPhase('video'), 2000);
            return () => clearTimeout(timer);
        } else if (loadingPhase === 'video') {
            // Load phone form after video form has time to initialize
            const timer = setTimeout(() => setLoadingPhase('phone'), 2000);
            return () => clearTimeout(timer);
        } else if (loadingPhase === 'phone') {
            // Mark as complete after phone form has time to initialize
            const timer = setTimeout(() => setLoadingPhase('complete'), 2000);
            return () => clearTimeout(timer);
        }
    }, [loadingPhase]);

    return (
        <div style={{ display: 'none' }} aria-hidden="true">
            {/* Progressive loading: only render iframes as we reach each phase */}

            {/* Load email form first (most commonly used) */}
            {loadingPhase !== 'waiting' && loadingPhase !== 'script' && (
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
            )}

            {/* Load video form second */}
            {(loadingPhase === 'video' || loadingPhase === 'phone' || loadingPhase === 'complete') && (
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
            )}

            {/* Load phone form last */}
            {(loadingPhase === 'phone' || loadingPhase === 'complete') && (
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
            )}
        </div>
    );
};

export default ContactPreloader;
