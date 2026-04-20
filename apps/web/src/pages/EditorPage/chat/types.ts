/* ============================================================
   Chat — shared types fuer ChatPanel + useChatHistory.
   ============================================================ */

export interface ChatMessage {
    id:         string;                       // server-UUID oder `local-<counter>` fuer optimistic
    role:       'user' | 'assistant' | 'system';
    content:    string;
    metadata?:  Record<string, unknown>;
    createdAt:  string;                       // ISO
    status?:    'persisted' | 'pending' | 'error';
}

export type ChatStatus = 'idle' | 'sending';
