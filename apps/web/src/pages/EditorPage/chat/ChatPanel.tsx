/* ============================================================
   ChatPanel — Verlauf + Eingabe-Textarea.
   State (draft) lokal; History kommt als Prop rein.
   Cmd/Ctrl+Enter submitted das Formular.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import './ChatPanel.css';
import type { ChatMessage, ChatStatus } from './types';

export interface ChatPanelProps {
    messages: ChatMessage[];
    status:   ChatStatus;
    onSubmit: (userMessage: string) => Promise<void>;
    onRetry?: (localId: string) => void;
}

export function ChatPanel({ messages, status, onSubmit, onRetry }: ChatPanelProps) {
    const [draft, setDraft] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll zu Bottom bei neuen Messages oder Status-Wechsel.
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, status]);

    async function handleSubmit(e: FormEvent): Promise<void> {
        e.preventDefault();
        const trimmed = draft.trim();
        if (!trimmed || status === 'sending') return;
        setDraft('');
        await onSubmit(trimmed);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            const form = e.currentTarget.form;
            form?.requestSubmit();
        }
    }

    return (
        <section className="chat_panel">
            <div className="chat_panel__messages" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="chat_panel__empty">Beschreibe deine Website.</div>
                )}
                {messages.map((m) => (
                    <ChatMessageItem key={m.id} message={m} onRetry={onRetry} />
                ))}
                {status === 'sending' && (
                    <div className="chat_panel__thinking">LLM denkt…</div>
                )}
            </div>
            <form className="chat_panel__input" onSubmit={handleSubmit}>
                <textarea
                    className="chat_panel__textarea"
                    rows={3}
                    placeholder="Änderungen beschreiben… (⌘↵ zum Senden)"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={status === 'sending'}
                    aria-label="Chat-Eingabe"
                />
                <button
                    type="submit"
                    className="chat_panel__submit"
                    disabled={status === 'sending' || !draft.trim()}
                >
                    Senden
                </button>
            </form>
        </section>
    );
}

// --- Subcomponent --------------------------------------------------------

interface ChatMessageItemProps {
    message:  ChatMessage;
    onRetry?: (localId: string) => void;
}

function ChatMessageItem({ message, onRetry }: ChatMessageItemProps) {
    const classes: string[] = [
        'chat_panel__message',
        `chat_panel__message--${message.role}`,
    ];
    if (message.status === 'error') {
        classes.push('chat_panel__message--error');
    }

    return (
        <div className={classes.join(' ')}>
            <div className="chat_panel__message-content">{message.content}</div>
            {message.status === 'error' && (
                <button
                    type="button"
                    className="chat_panel__retry"
                    onClick={() => onRetry?.(message.id)}
                >
                    ↻ Erneut senden
                </button>
            )}
        </div>
    );
}
