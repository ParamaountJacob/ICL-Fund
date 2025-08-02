import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ChatWidgetController = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        if (!isHomePage) {
            // Show chat widget immediately on non-home pages
            return;
        }

        // On home page, sync with header visibility (scroll positions 500-800)
        const handleScroll = () => {
            const scrollPosition = window.scrollY;

            // Same logic as your header: show when scroll > 500, fully visible at 800
            const shouldShow = scrollPosition > 500;

            // Simple opacity calculation like your header
            const opacity = scrollPosition <= 500 ? 0 :
                scrollPosition >= 800 ? 1 :
                    (scrollPosition - 500) / 300; // Linear fade from 500 to 800

            // Find and control chat widget
            const findAndControlWidget = () => {
                const widgets = document.querySelectorAll('iframe[src*="leadconnectorhq.com"], [data-widget-id="688d67de81758bc2473c0cee"]');

                widgets.forEach(widget => {
                    const element = widget as HTMLElement;
                    element.style.opacity = shouldShow ? opacity.toString() : '0';
                    element.style.pointerEvents = shouldShow ? 'auto' : 'none';
                    element.style.transition = 'opacity 0.3s ease-out';
                });
            };

            findAndControlWidget();

            // Check again after a short delay for late-loading widgets
            setTimeout(findAndControlWidget, 100);
        };

        // Initial check
        handleScroll();

        // Listen to scroll
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isHomePage]);

    return null;
};

export default ChatWidgetController;
