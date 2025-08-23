import { useEffect, useState } from 'react';

/**
 * Compute a responsive iframe height that fits within the current viewport
 * minus any fixed headers and desired padding. It updates on resize and
 * orientation changes. Useful for 3rd-party booking/form embeds.
 */
export function useEmbedHeight(options?: {
    /** Pixels to reserve for fixed navbars/headers above the iframe */
    reservedTop?: number;
    /** Minimum height in pixels to avoid tiny iframes on short viewports */
    min?: number;
    /** Extra padding below the fold to avoid internal widget scrollbars */
    extra?: number;
}): number {
    const { reservedTop = 160, min = 700, extra = 0 } = options || {};
    const [height, setHeight] = useState(() => {
        if (typeof window === 'undefined') return min;
        const vh = getViewportHeight();
        return Math.max(vh - reservedTop + extra, min);
    });

    useEffect(() => {
        const compute = () => {
            const vh = getViewportHeight();
            setHeight(Math.max(vh - reservedTop + extra, min));
        };
        compute();
        window.addEventListener('resize', compute);
        window.addEventListener('orientationchange', compute);
        return () => {
            window.removeEventListener('resize', compute);
            window.removeEventListener('orientationchange', compute);
        };
    }, [reservedTop, min, extra]);

    return height;
}

// Use modern viewport units if available, with fallbacks
function getViewportHeight(): number {
    // Try dynamic viewport height if supported
    const dvh = (window as any).visualViewport?.height;
    if (typeof dvh === 'number') return Math.round(dvh);
    return window.innerHeight || document.documentElement.clientHeight || 800;
}

/**
 * Ensures the LeadConnector embed script exists on the page.
 * Some widgets auto-resize via postMessage only when this script is present.
 */
export function ensureLeadConnectorScript() {
    const scriptId = 'leadconnector-form-embed';
    if (!document.getElementById(scriptId)) {
        const s = document.createElement('script');
        s.id = scriptId;
        s.src = 'https://link.msgsndr.com/js/form_embed.js';
        s.async = true;
        document.body.appendChild(s);
    }
}
