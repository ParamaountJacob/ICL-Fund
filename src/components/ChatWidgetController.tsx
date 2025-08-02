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
    const [isScriptInjected, setIsScriptInjected] = useState(false);
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Check if current route should hide the widget
    const shouldHideOnCurrentRoute = hideOnRoutes.includes(location.pathname);

    // IRONCLAD: Nuclear cleanup function
    const nuclearDestroy = () => {
        console.log('🚀 NUCLEAR DESTROY: Obliterating chat widget');

        // 1. Remove the script
        if (scriptRef.current && document.body.contains(scriptRef.current)) {
            document.body.removeChild(scriptRef.current);
            scriptRef.current = null;
        }

        // 2. Find and destroy ALL possible chat elements
        const selectors = [
            '[data-widget-id="688d67de81758bc2473c0cee"]',
            '.lc-chat-widget',
            '.leadconnector-chat',
            '[class*="chat-widget"]',
            '[class*="leadconnector"]',
            '[id*="chat"]',
            '[id*="leadconnector"]',
            'iframe[src*="leadconnectorhq"]',
            'div[style*="z-index: 9999"]',
            'div[style*="position: fixed"][style*="bottom"]'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.remove();
                console.log(`💥 Destroyed element: ${selector}`);
            });
        });

        // 3. Clear any global variables
        if (window.LeadConnector) {
            try {
                delete window.LeadConnector;
            } catch (e) {
                window.LeadConnector = undefined;
            }
        }

        // 4. Clear intervals
        if (cleanupIntervalRef.current) {
            clearInterval(cleanupIntervalRef.current);
            cleanupIntervalRef.current = null;
        }

        setIsScriptInjected(false);
        console.log('✅ NUCLEAR DESTROY: Complete');
    };

    // IRONCLAD: Script injection function
    const injectScript = () => {
        if (isScriptInjected || shouldHideOnCurrentRoute) return;

        console.log('🚀 INJECTING: Chat widget script');

        // Create the script
        const script = document.createElement('script');
        script.src = 'https://widgets.leadconnectorhq.com/loader.js';
        script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
        script.setAttribute('data-widget-id', '688d67de81758bc2473c0cee');
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log('✅ Script loaded successfully');
            setIsScriptInjected(true);
            scriptRef.current = script;

            // Set up continuous monitoring to ensure widget stays in our container
            cleanupIntervalRef.current = setInterval(() => {
                if (!shouldShow) return;

                const widgetElements = document.querySelectorAll(
                    '[data-widget-id="688d67de81758bc2473c0cee"], .lc-chat-widget, [class*="chat-widget"]'
                );

                widgetElements.forEach(element => {
                    const el = element as HTMLElement;
                    // Ensure the widget respects our container's visibility
                    if (containerRef.current && containerRef.current.style.display === 'none') {
                        el.style.display = 'none !important';
                        el.style.visibility = 'hidden !important';
                        el.style.opacity = '0 !important';
                    }
                });
            }, 500);
        };

        script.onerror = () => {
            console.error('❌ Failed to load chat widget script');
            setIsScriptInjected(false);
        };

        document.body.appendChild(script);
    };

    // Handle scroll-based visibility with bidirectional detection
    useEffect(() => {
        if (!autoHideOnHero || shouldHideOnCurrentRoute) {
            setShouldShow(false);
            return;
        }

        const handleScroll = () => {
            const scrolled = window.scrollY > showAfterScroll;
            const newShouldShow = scrolled && isVisible;

            // Only update if there's a change
            if (newShouldShow !== shouldShow) {
                setShouldShow(newShouldShow);
                console.log(`📜 Scroll: ${newShouldShow ? 'SHOW' : 'HIDE'} widget (scrollY: ${window.scrollY})`);
            }
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [autoHideOnHero, showAfterScroll, isVisible, shouldHideOnCurrentRoute, shouldShow]);

    // IRONCLAD: Main visibility control
    useEffect(() => {
        if (shouldShow && !shouldHideOnCurrentRoute) {
            // Show: Inject script if not already injected
            if (!isScriptInjected) {
                injectScript();
            }

            // Make container visible
            if (containerRef.current) {
                containerRef.current.style.display = 'block';
                containerRef.current.style.visibility = 'visible';
                containerRef.current.style.opacity = '1';
            }

            console.log('👁️ SHOW: Widget should be visible');
        } else {
            // Hide: Nuclear option
            if (containerRef.current) {
                containerRef.current.style.display = 'none';
                containerRef.current.style.visibility = 'hidden';
                containerRef.current.style.opacity = '0';
            }

            // NUCLEAR: Completely destroy everything
            nuclearDestroy();
            console.log('🙈 HIDE: Widget destroyed');
        }
    }, [shouldShow, shouldHideOnCurrentRoute, isScriptInjected]);

    // Route change cleanup
    useEffect(() => {
        if (shouldHideOnCurrentRoute) {
            nuclearDestroy();
        }
    }, [location.pathname, shouldHideOnCurrentRoute]);

    // Component unmount cleanup
    useEffect(() => {
        return () => {
            nuclearDestroy();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            id="chat-widget-fortress"
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                display: shouldShow && !shouldHideOnCurrentRoute ? 'block' : 'none',
                visibility: shouldShow && !shouldHideOnCurrentRoute ? 'visible' : 'hidden',
                opacity: shouldShow && !shouldHideOnCurrentRoute ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                pointerEvents: shouldShow ? 'auto' : 'none'
            }}
        >
            {/* FORTRESS CONTAINER: The widget will be injected here by the script */}
            {shouldShow && !shouldHideOnCurrentRoute && (
                <div
                    id="chat-widget-container"
                    style={{
                        position: 'relative',
                        zIndex: 10000
                    }}
                >
                    {/* Script will inject the widget here */}
                </div>
            )}
        </div>
    );
};

export default ChatWidgetController;