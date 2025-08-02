import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ChatWidgetController = () => {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        if (!isHomePage) {
            // Show chat widget immediately on non-home pages
            setIsVisible(true);
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
        // Control chat widget visibility
        const chatWidget = document.querySelector('[data-widget-id="688d67de81758bc2473c0cee"]');
        const chatContainer = document.querySelector('.chat-widget-container, .leadconnector-chat-widget, [class*="chat"], [id*="chat"]');

        // Try multiple selectors to find the chat widget
        const widgetElements = [
            chatWidget,
            chatContainer,
            ...Array.from(document.querySelectorAll('div')).filter(el =>
                el.style.position === 'fixed' &&
                (el.style.bottom || el.style.right) &&
                el.style.zIndex
            )
        ].filter(Boolean);

        widgetElements.forEach(element => {
            if (element) {
                (element as HTMLElement).style.display = isVisible ? 'block' : 'none';
                (element as HTMLElement).style.opacity = isVisible ? '1' : '0';
                (element as HTMLElement).style.transition = 'opacity 0.3s ease-in-out';
            }
        });

        // If we can't find the widget elements, try a more aggressive approach
        if (widgetElements.length === 0) {
            const style = document.createElement('style');
            style.id = 'chat-widget-controller';
            style.textContent = `
        ${isVisible ? '' : `
          [data-widget-id="688d67de81758bc2473c0cee"],
          .leadconnector-chat-widget,
          .chat-widget,
          div[style*="position: fixed"][style*="bottom"],
          div[style*="position: fixed"][style*="right"] {
            display: none !important;
            opacity: 0 !important;
          }
        `}
      `;

            // Remove existing style if it exists
            const existingStyle = document.getElementById('chat-widget-controller');
            if (existingStyle) {
                existingStyle.remove();
            }

            document.head.appendChild(style);
        }
    }, [isVisible]);

    return null; // This component doesn't render anything
};

export default ChatWidgetController;
