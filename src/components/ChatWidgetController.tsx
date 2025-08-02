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
            const newShowState = scrolled && isVisible;

            // Only update if there's an actual change to prevent unnecessary re-renders
            setShouldShow(prevState => {
                if (prevState !== newShowState) {
                    return newShowState;
                }
                return prevState;
            });
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [autoHideOnHero, showAfterScroll, isVisible, shouldHideOnCurrentRoute]);

    // Load the chat widget script when needed
    useEffect(() => {
        if (!shouldShow || shouldHideOnCurrentRoute || isScriptLoaded) return;

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
    }, [shouldShow, shouldHideOnCurrentRoute, isScriptLoaded]);

    // Control widget visibility with aggressive override
    useEffect(() => {
        if (!isScriptLoaded) return;

        const controlWidget = () => {
            // Find all possible chat widget elements
            const selectors = [
                '[data-widget-id="688d67de81758bc2473c0cee"]',
                '.lc-chat-widget',
                '[class*="leadconnector"]',
                '[class*="chat-widget"]',
                '[class*="chat"]',
                '[id*="chat"]',
                'iframe[src*="leadconnector"]',
                'iframe[src*="chat"]'
            ];

            const elements = [];
            selectors.forEach(selector => {
                const found = document.querySelectorAll(selector);
                found.forEach(el => elements.push(el));
            });

            // Remove duplicates
            const uniqueElements = [...new Set(elements)];

            uniqueElements.forEach(element => {
                const el = element as HTMLElement;

                // Force override any inline styles the widget might set
                el.style.setProperty('transition', 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out', 'important');

                if (shouldShow && !shouldHideOnCurrentRoute) {
                    el.style.setProperty('display', 'block', 'important');
                    el.style.setProperty('visibility', 'visible', 'important');
                    el.style.setProperty('opacity', '1', 'important');
                    el.style.setProperty('transform', 'translateY(0px)', 'important');
                    el.style.setProperty('pointer-events', 'auto', 'important');
                } else {
                    // Forcefully hide the widget
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('transform', 'translateY(10px)', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('pointer-events', 'none', 'important');

                    // Set display none after transition, but keep overriding
                    setTimeout(() => {
                        el.style.setProperty('display', 'none', 'important');
                    }, 300);
                }
            });
        };

        // Initial control
        const timer = setTimeout(controlWidget, 500);

        // Keep fighting the widget every second when it should be hidden
        let interval: NodeJS.Timeout | null = null;
        if (!shouldShow || shouldHideOnCurrentRoute) {
            interval = setInterval(controlWidget, 1000);
        }

        // Also try to control via LeadConnector API
        try {
            if (window.LeadConnector) {
                if (shouldShow && !shouldHideOnCurrentRoute) {
                    window.LeadConnector.show?.();
                } else {
                    window.LeadConnector.hide?.();
                }
            }
        } catch (error) {
            console.warn('LeadConnector API not available:', error);
        }

        return () => {
            clearTimeout(timer);
            if (interval) clearInterval(interval);
        };
    }, [shouldShow, shouldHideOnCurrentRoute, isScriptLoaded]);

    // Aggressively hide widget on route changes that should hide it
    useEffect(() => {
        if (shouldHideOnCurrentRoute && isScriptLoaded) {
            const forceHide = () => {
                const selectors = [
                    '[data-widget-id="688d67de81758bc2473c0cee"]',
                    '.lc-chat-widget',
                    '[class*="leadconnector"]',
                    '[class*="chat-widget"]',
                    '[class*="chat"]',
                    '[id*="chat"]',
                    'iframe[src*="leadconnector"]',
                    'iframe[src*="chat"]'
                ];

                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        const el = element as HTMLElement;
                        el.style.setProperty('display', 'none', 'important');
                        el.style.setProperty('visibility', 'hidden', 'important');
                        el.style.setProperty('opacity', '0', 'important');
                        el.style.setProperty('pointer-events', 'none', 'important');
                    });
                });
            };

            // Force hide immediately and keep enforcing it
            forceHide();
            const interval = setInterval(forceHide, 500);

            return () => clearInterval(interval);
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