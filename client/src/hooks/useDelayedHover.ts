// Drives the quick-glance tooltip. Shown after a short delay on hover (so it doesn't pop in
// instantly while just passing the cursor over the graph) and hidden immediately on leave

import { useState, useRef, useEffect } from 'react';

export function useDelayedHover(delayMs: number, cancelWhen: boolean) {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<number | undefined>(undefined);

    function show() {
        timeoutRef.current = window.setTimeout(() => setIsVisible(true), delayMs);
    }
    function hide() {
        window.clearTimeout(timeoutRef.current);
        setIsVisible(false);
    }
    useEffect(() => { if (cancelWhen) hide(); }, [cancelWhen]);

    return { isVisible, show, hide };
}