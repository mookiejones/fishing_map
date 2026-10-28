import { useEffect, useRef, useState } from 'react';
import fetchWindField from './fetchWindField';
import uniformWindField from './uniformWindField';
import type { WindField } from './types';

export type WindFieldStatus = 'idle' | 'loading' | 'ready' | 'fallback';

interface WindFieldState {
    field:  WindField | null;
    status: WindFieldStatus;
}

let cached: WindField | null = null;

/**
 * Loads the gridded forecast the first time the wind layer is turned on
 * and keeps it for the rest of the session. A failed request falls back
 * to a uniform field so the layer still renders.
 */
export default function useWindField(
    enabled: boolean,
    fallbackSpeed: number,
    fallbackDir: number,
): WindFieldState {
    const [state, setState] = useState<WindFieldState>({
        field:  cached,
        status: cached ? 'ready' : 'idle',
    });
    const fallbackRef = useRef({ speed: fallbackSpeed, dir: fallbackDir });
    fallbackRef.current = { speed: fallbackSpeed, dir: fallbackDir };

    useEffect(() => {
        if (!enabled || cached) return;
        const controller = new AbortController();
        setState(prev => ({ field: prev.field, status: 'loading' }));
        fetchWindField(controller.signal)
            .then(field => {
                cached = field;
                setState({ field, status: 'ready' });
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return;
                if (err instanceof Error && err.name === 'AbortError') return;
                const { speed, dir } = fallbackRef.current;
                setState({
                    field:  uniformWindField(speed, dir),
                    status: 'fallback',
                });
            });
        return () => controller.abort();
    }, [enabled]);

    return state;
}
