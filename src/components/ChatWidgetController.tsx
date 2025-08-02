import React, { useEffect, useState } from 'react';

interface ChatWidgetControllerProps {
    isVisible?: boolean;
    hideOnRoutes?: string[];
    showOnRoutes?: string[];
}

const ChatWidgetController: React.FC<ChatWidgetControllerProps> = ({
    isVisible = true,
    hideOnRoutes = [],
    showOnRoutes = []
}) => {
    const [widgetElement, setWidgetElement] = useState<HTMLElement | null>(null);
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    useEffect(() => {
        // Function to find the chat widget element
        const findWidget = () => {
            // Try multiple selectors to find the widget
            const selectors = [
                '[data-widget-id="688d67de81758bc2473c0cee"]',
                '.leadconnector-chat-widget',
                '[id*="leadconnector"]',
                '[class*="chat-widget"]',
                'iframe[src*="leadconnectorhq"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector) as HTMLElement;
                if (element) {
                    return element;
                }
            }
            return null;
        };

        // Try to find widget immediately
        let widget = findWidget();

        if (!widget) {
            // If not found, keep checking until it loads
            const interval = setInterval(() => {
                widget = findWidget();
                if (widget) {
                    setWidgetElement(widget);
                    clearInterval(interval);
                }
            }, 500);

            // Clear interval after 10 seconds to avoid infinite checking
            setTimeout(() => clearInterval(interval), 10000);
        } else {
            setWidgetElement(widget);
        }

        // Listen for route changes
        const handleRouteChange = () => {
            setCurrentPath(window.location.pathname);
        };

        window.addEventListener('popstate', handleRouteChange);

        // For React Router, we can also listen to navigation events
        const observer = new MutationObserver(() => {
            if (window.location.pathname !== currentPath) {
                setCurrentPath(window.location.pathname);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('popstate', handleRouteChange);
            observer.disconnect();
        };
    }, [currentPath]);

    useEffect(() => {
        if (!widgetElement) return;

        // Determine if widget should be visible based on routes
        let shouldShow = isVisible;

        if (hideOnRoutes.length > 0) {
            shouldShow = shouldShow && !hideOnRoutes.some(route => currentPath.includes(route));
        }

        if (showOnRoutes.length > 0) {
            shouldShow = showOnRoutes.some(route => currentPath.includes(route));
        }

        // Apply visibility with smooth transition
        if (shouldShow) {
            showWidget(widgetElement);
        } else {
            hideWidget(widgetElement);
        }
    }, [widgetElement, currentPath, isVisible, hideOnRoutes, showOnRoutes]);

    const hideWidget = (element: HTMLElement) => {
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        element.style.pointerEvents = 'none';

        // Optionally completely hide after animation
        setTimeout(() => {
            if (element.style.opacity === '0') {
                element.style.display = 'none';
            }
        }, 300);
    };

    const showWidget = (element: HTMLElement) => {
        element.style.display = 'block';
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
        element.style.pointerEvents = 'auto';
    };

    // Expose methods to parent components
    useEffect(() => {
        // Add global methods to control widget
        (window as any).chatWidget = {
            hide: () => widgetElement && hideWidget(widgetElement),
            show: () => widgetElement && showWidget(widgetElement),
            toggle: () => {
                if (widgetElement) {
                    const isHidden = widgetElement.style.opacity === '0' || widgetElement.style.display === 'none';
                    if (isHidden) {
                        showWidget(widgetElement);
                    } else {
                        hideWidget(widgetElement);
                    }
                }
            }
        };
    }, [widgetElement]);

    return null; // This component doesn't render anything visible
};

export default ChatWidgetController;