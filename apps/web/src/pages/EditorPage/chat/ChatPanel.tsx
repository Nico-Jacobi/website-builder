/* ============================================================
   ChatPanel — Verlauf + Eingabe-Textarea.
   State (draft) lokal; History kommt als Prop rein.
   Enter submitted, Shift+Enter fügt Zeilenumbruch ein.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import './ChatPanel.css';
import type { ChatMessage, ChatStatus } from './types';
import { RefineScopeToggle } from './RefineScopeToggle';
import type { RefineScope } from './RefineScopeToggle';

export interface ChatPanelProps {
    messages:       ChatMessage[];
    status:         ChatStatus;
    onSubmit:       (userMessage: string) => Promise<void>;
    refineScope:    RefineScope;
    onScopeChange:  (scope: RefineScope) => void;
    activePagePath: string;
}

export function ChatPanel({ messages, status, onSubmit, refineScope, onScopeChange, activePagePath }: ChatPanelProps) {
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.form;
            form?.requestSubmit();
        }
    }

    return (
        <section className="chat_panel">
            <div className="chat_panel__messages" ref={scrollRef}>
                {messages.map((m) => (
                    <ChatMessageItem key={m.id} message={m} />
                ))}
                {status === 'sending' && (
                    <div
                        className="chat_panel__thinking"
                        role="status"
                        aria-live="polite"
                    >
                        <span className="chat_panel__thinking-dot" />
                        <span className="chat_panel__thinking-dot" />
                        <span className="chat_panel__thinking-dot" />
                        <span className="chat_panel__thinking-label">denkt nach</span>
                    </div>
                )}
            </div>
            <RefineScopeToggle
                value={refineScope}
                onChange={onScopeChange}
                activePagePath={activePagePath}
            />
            <form className="chat_panel__input" onSubmit={handleSubmit}>
                <textarea
                    className="chat_panel__textarea"
                    rows={3}
                    placeholder="Änderungen beschreiben… (↵ zum Senden, ⇧↵ für neue Zeile)"
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
                    aria-label="Senden"
                >
                    <span>Senden</span>
                    <ArrowUp size={14} strokeWidth={2} aria-hidden="true" />
                </button>
            </form>
        </section>
    );
}

// --- Subcomponent --------------------------------------------------------

interface ChatMessageItemProps {
    message: ChatMessage;
}

function ChatMessageItem({ message }: ChatMessageItemProps) {
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
        </div>
    );
}
