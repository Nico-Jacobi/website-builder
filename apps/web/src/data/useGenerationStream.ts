import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sitemap } from '@website-builder/shared';

const apiBase: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

export interface SiteGenerationState {
    sitemap: Sitemap | undefined;
    pages: Map<string, string>;
    isGenerating: boolean;
    lastError: string | undefined;
}

export type StreamEvent =
    | { type: 'snapshot'; pages: Array<{ path: string; status: string }>; sitemap: Sitemap | null; hasChrome: boolean }
    | { type: 'idle' }
    | { type: 'landing_started' }
    | { type: 'landing_done'; sitemap: Sitemap }
    | { type: 'subpage_started'; path: string }
    | { type: 'subpage_done'; path: string }
    | { type: 'subpage_failed'; path: string; reason: string }
    | { type: 'complete' }
    | { type: 'error'; reason: string };

export type StreamListener = (event: StreamEvent) => void;

export interface UseGenerationStreamResult {
    state: SiteGenerationState;
    subscribe: (listener: StreamListener) => () => void;
}

const initialState: SiteGenerationState = {
    sitemap: undefined,
    pages: new Map(),
    isGenerating: false,
    lastError: undefined,
};

function setStatus(pages: Map<string, string>, path: string, status: string): Map<string, string> {
    const next = new Map(pages);
    next.set(path, status);
    return next;
}

function reduceEvent(state: SiteGenerationState, event: StreamEvent): SiteGenerationState {
    switch (event.type) {
        case 'snapshot':
            return {
                sitemap: event.sitemap ?? undefined,
                pages: new Map(event.pages.map(p => [p.path, p.status])),
                isGenerating: event.pages.some(p => p.status === 'generating' || p.status === 'pending'),
                lastError: undefined,
            };
        case 'idle':
            return { ...state, isGenerating: false };
        case 'landing_started':
            return { ...state, isGenerating: true };
        case 'landing_done':
            return { ...state, sitemap: event.sitemap, isGenerating: true };
        case 'subpage_started':
            return { ...state, pages: setStatus(state.pages, event.path, 'generating'), isGenerating: true };
        case 'subpage_done':
            return { ...state, pages: setStatus(state.pages, event.path, 'ready') };
        case 'subpage_failed':
            return { ...state, pages: setStatus(state.pages, event.path, 'failed'), lastError: event.reason };
        case 'complete':
            return { ...state, isGenerating: false };
        case 'error':
            return { ...state, isGenerating: false, lastError: event.reason };
        default:
            return state;
    }
}

export function useGenerationStream(identifier: string): UseGenerationStreamResult {
    const [state, setState] = useState<SiteGenerationState>(initialState);
    const listenersRef = useRef<Set<StreamListener>>(new Set());

    useEffect(() => {
        if (!identifier) return;
        const es = new EventSource(`${apiBase}/api/sites/${identifier}/generation-stream`);
        es.onmessage = (msg) => {
            let event: StreamEvent;
            try {
                event = JSON.parse(msg.data as string) as StreamEvent;
            } catch {
                return;
            }
            setState(prev => reduceEvent(prev, event));
            for (const listener of listenersRef.current) listener(event);
        };
        es.onerror = () => {
            setState(prev => ({ ...prev, lastError: 'connection lost' }));
        };
        return () => es.close();
    }, [identifier]);

    const subscribe = useCallback((listener: StreamListener) => {
        listenersRef.current.add(listener);
        return () => { listenersRef.current.delete(listener); };
    }, []);

    return { state, subscribe };
}
