import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ChatWidgetController = () => {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        // Immediately inject CSS to hide chat widget on home page
        if (isHomePage) {
            const hideStyle = document.createElement('style');
            hideStyle.id = 'chat-widget-initial-hide';
            hideStyle.textContent = `
                [data-widget-id="688d67de81758bc2473c0cee"],
                .leadconnector-chat-widget,
                .chat-widget,
                div[style*="position: fixed"][style*="bottom"],
                div[style*="position: fixed"][style*="right"],
                iframe[src*="leadconnectorhq.com"],
                div[class*="widget"],
                div[id*="widget"],
                div[class*="chat"],
                div[id*="chat"] {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }
            `;
            document.head.appendChild(hideStyle);

            // Clean up on component unmount or route change
            return () => {
                const existingStyle = document.getElementById('chat-widget-initial-hide');
                if (existingStyle) {
                    existingStyle.remove();
                }
            };
        }
    }, [isHomePage]);

    useEffect(() => {
        if (!isHomePage) {
            // Show chat widget immediately on non-home pages
            setIsVisible(true);
            // Remove any hide styles
            const hideStyle = document.getElementById('chat-widget-initial-hide');
            if (hideStyle) {
                hideStyle.remove();
            }
            return;
        }

        // On home page, hide initially and show after scrolling past hero
        setIsVisible(false);

        const handleScroll = () => {
            // Show chat widget after scrolling past the hero section (approximately 100vh)
            const scrollPosition = window.scrollY;
            const heroHeight = window.innerHeight; // Approximate hero height

            if (scrollPosition > heroHeight * 0.8) { // Show when 80% through hero
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Check initial scroll position
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isHomePage]);

    useEffect(() => {
        // Control chat widget visibility based on isVisible state
        const controlVisibility = () => {
            // Control chat widget visibility
            const chatWidget = document.querySelector('[data-widget-id="688d67de81758bc2473c0cee"]');
            const chatContainer = document.querySelector('.leadconnector-chat-widget, [class*="chat"], [id*="chat"]');

            // Try multiple selectors to find the chat widget
            const widgetElements = [
                chatWidget,
                chatContainer,
                ...Array.from(document.querySelectorAll('div')).filter(el =>
                    el.style.position === 'fixed' &&
                    (el.style.bottom || el.style.right) &&
                    el.style.zIndex
                ),
                ...Array.from(document.querySelectorAll('iframe')).filter(el =>
                    el.src && el.src.includes('leadconnectorhq.com')
                )
            ].filter(Boolean);

            widgetElements.forEach(element => {
                if (element) {
                    (element as HTMLElement).style.display = isVisible ? 'block' : 'none';
                    (element as HTMLElement).style.opacity = isVisible ? '1' : '0';
                    (element as HTMLElement).style.visibility = isVisible ? 'visible' : 'hidden';
                    (element as HTMLElement).style.transition = 'opacity 0.3s ease-in-out';
                }
            });

            // Use CSS injection as backup
            const style = document.createElement('style');
            style.id = 'chat-widget-controller';
            style.textContent = `
                ${isVisible ? `
                    [data-widget-id="688d67de81758bc2473c0cee"],
                    .leadconnector-chat-widget,
                    .chat-widget,
                    div[style*="position: fixed"][style*="bottom"],
                    div[style*="position: fixed"][style*="right"],
                    iframe[src*="leadconnectorhq.com"],
                    div[class*="widget"],
                    div[id*="widget"],
                    div[class*="chat"],
                    div[id*="chat"] {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                        transition: opacity 0.3s ease-in-out !important;
                    }
                ` : `
                    [data-widget-id="688d67de81758bc2473c0cee"],
                    .leadconnector-chat-widget,
                    .chat-widget,
                    div[style*="position: fixed"][style*="bottom"],
                    div[style*="position: fixed"][style*="right"],
                    iframe[src*="leadconnectorhq.com"],
                    div[class*="widget"],
                    div[id*="widget"],
                    div[class*="chat"],
                    div[id*="chat"] {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }
                `}
            `;

            // Remove existing style if it exists
            const existingStyle = document.getElementById('chat-widget-controller');
            if (existingStyle) {
                existingStyle.remove();
            }

            document.head.appendChild(style);
        };

        // Run immediately
        controlVisibility();

        // Also run after a short delay to catch any late-loading widgets
        const timeouts = [
            setTimeout(controlVisibility, 100),
            setTimeout(controlVisibility, 500),
            setTimeout(controlVisibility, 1000),
            setTimeout(controlVisibility, 2000)
        ];

        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [isVisible]);

    return null; // This component doesn't render anything
};

export default ChatWidgetController;
