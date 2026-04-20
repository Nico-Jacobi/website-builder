/* ============================================================
   useChatHistory — laedt, persistiert und verwaltet Chat-Messages.

   Optimistic-Append-Pattern:
   - Append fuegt sofort lokal eine Message mit status:'pending' ein.
   - Parallel wird postMessage(...) aufgerufen.
   - Bei Erfolg: lokale Message wird durch Server-Row ersetzt (neue id,
     createdAt, status:'persisted').
   - Bei Fehler: status:'error' — retry(localId) kann erneut senden.

   Der Hook haelt die Pending-Count-Information via useRef (keine
   Re-Renders durch Counter-Updates). status:'sending' solange
   mindestens eine Message pending ist.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    listMessages,
    postMessage,
    type MessageRole,
    type MessageRow,
    type PostMessageInput,
} from '../../../data/siteClient';
import type { ChatMessage, ChatStatus } from './types';

export interface UseChatHistoryResult {
    messages:        ChatMessage[];
    status:          ChatStatus;
    appendUser:      (content: string) => Promise<void>;
    appendAssistant: (content: string, metadata?: Record<string, unknown>) => Promise<void>;
    appendSystem:    (content: string, metadata?: Record<string, unknown>) => Promise<void>;
    retry:           (localId: string) => Promise<void>;
    refresh:         () => Promise<void>;
}

export function useChatHistory(identifier: string): UseChatHistoryResult {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const localCounterRef = useRef<number>(0);

    // ---------------------------------------------------------------
    // Initial load + refresh
    // ---------------------------------------------------------------
    const loadInitial = useCallback(
        async (cancelledRef: { cancelled: boolean }): Promise<void> => {
            try {
                const rows = await listMessages(identifier);
                if (cancelledRef.cancelled) return;
                setMessages(rows.map((r) => rowToMessage(r)));
            } catch (err) {
                if (cancelledRef.cancelled) return;
                // Bei Fehler: leer lassen und in die Console loggen.
                // Der User sieht den leeren Verlauf; Senden funktioniert weiter.
                // eslint-disable-next-line no-console
                console.error('useChatHistory: listMessages failed', err);
            }
        },
        [identifier],
    );

    useEffect(() => {
        const cancelledRef = { cancelled: false };
        void loadInitial(cancelledRef);
        return () => {
            cancelledRef.cancelled = true;
        };
    }, [loadInitial]);

    const refresh = useCallback(async (): Promise<void> => {
        const rows = await listMessages(identifier);
        setMessages(rows.map((r) => rowToMessage(r)));
    }, [identifier]);

    // ---------------------------------------------------------------
    // Append-Helper (gemeinsame Logik fuer user/assistant/system)
    // ---------------------------------------------------------------
    const doAppend = useCallback(
        async (
            role:      MessageRole,
            content:   string,
            metadata?: Record<string, unknown>,
        ): Promise<void> => {
            localCounterRef.current += 1;
            const localId = `local-${localCounterRef.current}`;
            const createdAt = new Date().toISOString();

            const optimistic: ChatMessage = {
                id:       localId,
                role,
                content,
                createdAt,
                status:   'pending',
                ...(metadata !== undefined ? { metadata } : {}),
            };
            setMessages((prev) => [...prev, optimistic]);

            const payload: PostMessageInput = metadata !== undefined
                ? { role, content, metadata }
                : { role, content };

            try {
                const row = await postMessage(identifier, payload);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === localId
                            ? rowToMessage(row, 'persisted')
                            : m,
                    ),
                );
            } catch (err) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === localId
                            ? { ...m, status: 'error' }
                            : m,
                    ),
                );
                // eslint-disable-next-line no-console
                console.error('useChatHistory: postMessage failed', err);
            }
        },
        [identifier],
    );

    const appendUser = useCallback(
        (content: string): Promise<void> => doAppend('user', content),
        [doAppend],
    );

    const appendAssistant = useCallback(
        (content: string, metadata?: Record<string, unknown>): Promise<void> =>
            doAppend('assistant', content, metadata),
        [doAppend],
    );

    const appendSystem = useCallback(
        (content: string, metadata?: Record<string, unknown>): Promise<void> =>
            doAppend('system', content, metadata),
        [doAppend],
    );

    // ---------------------------------------------------------------
    // Retry: erneut senden einer zuvor fehlgeschlagenen Message.
    // Wir nutzen die gleiche lokale id (kein neuer Counter), damit
    // der Button im UI stabil bleibt.
    // ---------------------------------------------------------------
    // messagesRef spiegelt den aktuellen messages-State synchron, damit
    // retry() das Ziel ermitteln kann ohne auf setMessages-Closure-
    // Seiteneffekte angewiesen zu sein (Strict-Mode-sicher).
    const messagesRef = useRef<ChatMessage[]>(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const retry = useCallback(
        async (localId: string): Promise<void> => {
            const target = messagesRef.current.find((m) => m.id === localId);
            if (!target) return;

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === localId ? { ...m, status: 'pending' } : m,
                ),
            );

            const payload: PostMessageInput = target.metadata !== undefined
                ? { role: target.role, content: target.content, metadata: target.metadata }
                : { role: target.role, content: target.content };

            try {
                const row = await postMessage(identifier, payload);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === localId
                            ? rowToMessage(row, 'persisted')
                            : m,
                    ),
                );
            } catch (err) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === localId
                            ? { ...m, status: 'error' }
                            : m,
                    ),
                );
                // eslint-disable-next-line no-console
                console.error('useChatHistory: retry postMessage failed', err);
            }
        },
        [identifier],
    );

    // ---------------------------------------------------------------
    // Abgeleiteter Status: sending, wenn irgendeine Message pending ist.
    // ---------------------------------------------------------------
    const status: ChatStatus = messages.some((m) => m.status === 'pending')
        ? 'sending'
        : 'idle';

    return {
        messages,
        status,
        appendUser,
        appendAssistant,
        appendSystem,
        retry,
        refresh,
    };
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function rowToMessage(
    row:     MessageRow,
    status?: ChatMessage['status'],
): ChatMessage {
    const msg: ChatMessage = {
        id:        row.id,
        role:      row.role,
        content:   row.content,
        createdAt: row.createdAt,
        status:    status ?? 'persisted',
    };
    if (row.metadata !== null && row.metadata !== undefined) {
        msg.metadata = row.metadata;
    }
    return msg;
}
