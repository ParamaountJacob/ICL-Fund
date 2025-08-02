import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface ChatWidgetControllerProps {
    isVisible?: boolean;
    hideOnRoutes?: string[];
    showAfterScroll?: number;
    autoHideOnHero?: boolean;
}

declare global {
    interface Window {
        LeadConnector?: any;
        lcwSettings?: any;
    }
}

const ChatWidgetController: React.FC<ChatWidgetControllerProps> = ({
    isVisible = true,
    hideOnRoutes = [],
    showAfterScroll = 100,
    autoHideOnHero = true
}) => {
    const [shouldShow, setShouldShow] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const location = useLocation();
    const widgetRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    // Check if current route should hide the widget
    const shouldHideOnCurrentRoute = hideOnRoutes.includes(location.pathname);

    // Handle scroll-based visibility
    useEffect(() => {
        if (!autoHideOnHero || shouldHideOnCurrentRoute) return;

        const handleScroll = () => {
            const scrolled = window.scrollY > showAfterScroll;
            setShouldShow(scrolled && isVisible);
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [autoHideOnHero, showAfterScroll, isVisible, shouldHideOnCurrentRoute]);

    // Load the chat widget script when needed
    useEffect(() => {
        // Always load script on contact page, or when shouldShow is true
        const isContactPage = location.pathname === '/contact';
        const shouldLoadScript = (shouldShow || isContactPage) && !shouldHideOnCurrentRoute && !isScriptLoaded;

        if (!shouldLoadScript) return;

        // Load the script dynamically
        const script = document.createElement('script');
        script.src = 'https://widgets.leadconnectorhq.com/loader.js';
        script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
        script.setAttribute('data-widget-id', '688d67de81758bc2473c0cee');
        script.async = true;

        script.onload = () => {
            setIsScriptLoaded(true);
            scriptRef.current = script;
        };

        script.onerror = () => {
            console.error('Failed to load chat widget script');
        };

        document.body.appendChild(script);

        return () => {
            // Clean up script when component unmounts
            if (scriptRef.current && document.body.contains(scriptRef.current)) {
                document.body.removeChild(scriptRef.current);
                setIsScriptLoaded(false);
            }
        };
    }, [shouldShow, shouldHideOnCurrentRoute, isScriptLoaded, location.pathname]);

    // Control widget visibility
    useEffect(() => {
        if (!isScriptLoaded) return;

        // Wait a bit for the widget to initialize
        const timer = setTimeout(() => {
            // Try to find and control the LeadConnector widget
            const chatWidget = document.querySelector('[data-widget-id="688d67de81758bc2473c0cee"]');
            const chatContainer = document.querySelector('.lc-chat-widget') ||
                document.querySelector('[class*="chat"]') ||
                document.querySelector('[id*="chat"]');

            const targetElement = chatWidget || chatContainer;
            const isContactPage = location.pathname === '/contact';

            if (targetElement) {
                const element = targetElement as HTMLElement;
                const isContactPage = location.pathname === '/contact';

                // Hide widget on contact page initially, but keep it loaded for the email button
                if (shouldShow && !shouldHideOnCurrentRoute && !isContactPage) {
                    element.style.display = 'block';
                    element.style.opacity = '1';
                    element.style.visibility = 'visible';
                    element.style.transition = 'opacity 0.3s ease-in-out';
                } else {
                    element.style.display = 'none';
                    element.style.opacity = '0';
                    element.style.visibility = 'hidden';
                }
            }

            // Also try to control via LeadConnector API if available
            if (window.LeadConnector && !isContactPage) {
                try {
                    if (shouldShow && !shouldHideOnCurrentRoute) {
                        window.LeadConnector.show?.();
                    } else {
                        window.LeadConnector.hide?.();
                    }
                } catch (error) {
                    console.warn('LeadConnector API not available:', error);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [shouldShow, shouldHideOnCurrentRoute, isScriptLoaded, location.pathname]);

    // Hide widget on route changes that should hide it
    useEffect(() => {
        if (shouldHideOnCurrentRoute && isScriptLoaded) {
            const chatElements = document.querySelectorAll(
                '[data-widget-id="688d67de81758bc2473c0cee"], .lc-chat-widget, [class*="chat"], [id*="chat"]'
            );

            chatElements.forEach(element => {
                const el = element as HTMLElement;
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            });
        }
    }, [location.pathname, shouldHideOnCurrentRoute, isScriptLoaded]);

    return (
        <div
            ref={widgetRef}
            id="chat-widget-controller"
            style={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                zIndex: 9999,
                pointerEvents: 'none' // Don't interfere with clicks
            }}
        >
            {/* This div helps us track the widget but doesn't render anything visible */}
        </div>
    );
};

export default ChatWidgetController;