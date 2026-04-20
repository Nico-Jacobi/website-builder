/* ============================================================
   useChatHistory — Hook-Tests mit gemockten siteClient-Calls.

   Szenarien:
   1. Mount laedt initial Messages per listMessages.
   2. appendUser fuegt pending-Message ein, resolved auf persisted.
   3. appendUser bei Fehler -> status:'error' auf der lokalen Message.
   4. retry wiederholt den postMessage-Call und laeuft erfolgreich durch.
   5. status ist 'sending' solange eine Message pending ist.
   ============================================================ */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useChatHistory } from './useChatHistory';

vi.mock('../../../data/siteClient', () => ({
    listMessages: vi.fn(),
    postMessage:  vi.fn(),
}));

import { listMessages, postMessage } from '../../../data/siteClient';

const listMessagesMock = vi.mocked(listMessages);
const postMessageMock  = vi.mocked(postMessage);

beforeEach(() => {
    listMessagesMock.mockReset();
    postMessageMock.mockReset();
    // Default: leerer Verlauf.
    listMessagesMock.mockResolvedValue([]);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('useChatHistory', () => {
    it('laedt initial Messages bei Mount', async () => {
        listMessagesMock.mockResolvedValueOnce([
            {
                id:        'srv-1',
                role:      'user',
                content:   'hallo',
                metadata:  null,
                createdAt: '2026-04-20T10:00:00.000Z',
            },
        ]);

        const { result } = renderHook(() => useChatHistory('site-123'));

        await waitFor(() => {
            expect(result.current.messages).toHaveLength(1);
        });

        expect(result.current.messages[0]).toMatchObject({
            id:      'srv-1',
            role:    'user',
            content: 'hallo',
            status:  'persisted',
        });
        expect(listMessagesMock).toHaveBeenCalledWith('site-123');
    });

    it('appendUser: pending -> persisted nach Resolve', async () => {
        let resolvePost: (row: unknown) => void = () => undefined;
        postMessageMock.mockImplementationOnce(
            () =>
                new Promise((res) => {
                    resolvePost = res as (row: unknown) => void;
                }),
        );

        const { result } = renderHook(() => useChatHistory('site-1'));
        await waitFor(() => expect(result.current.messages).toHaveLength(0));

        void act(() => {
            void result.current.appendUser('neue message');
        });

        // Pending-State sichtbar.
        await waitFor(() => expect(result.current.messages).toHaveLength(1));
        expect(result.current.messages[0].status).toBe('pending');
        expect(result.current.messages[0].id.startsWith('local-')).toBe(true);
        expect(result.current.status).toBe('sending');

        // Server antwortet.
        await act(async () => {
            resolvePost({
                id:        'srv-42',
                role:      'user',
                content:   'neue message',
                metadata:  null,
                createdAt: '2026-04-20T10:00:01.000Z',
            });
        });

        await waitFor(() => expect(result.current.messages[0].status).toBe('persisted'));
        expect(result.current.messages[0].id).toBe('srv-42');
        expect(result.current.status).toBe('idle');
    });

    it('appendUser: Fehler setzt status:"error"', async () => {
        postMessageMock.mockRejectedValueOnce(new Error('network down'));

        const { result } = renderHook(() => useChatHistory('site-1'));
        await waitFor(() => expect(result.current.messages).toHaveLength(0));

        await act(async () => {
            await result.current.appendUser('wird nicht ankommen');
        });

        await waitFor(() => expect(result.current.messages).toHaveLength(1));
        expect(result.current.messages[0].status).toBe('error');
        expect(result.current.status).toBe('idle'); // keine pending mehr
    });

    it('retry: sendet erneut und persistiert bei Success', async () => {
        postMessageMock.mockRejectedValueOnce(new Error('first try fails'));

        const { result } = renderHook(() => useChatHistory('site-1'));
        await waitFor(() => expect(result.current.messages).toHaveLength(0));

        await act(async () => {
            await result.current.appendUser('retry mich');
        });
        await waitFor(() => expect(result.current.messages[0].status).toBe('error'));

        const localId = result.current.messages[0].id;

        postMessageMock.mockResolvedValueOnce({
            id:        'srv-99',
            role:      'user',
            content:   'retry mich',
            metadata:  null,
            createdAt: '2026-04-20T10:00:02.000Z',
        });

        await act(async () => {
            await result.current.retry(localId);
        });

        await waitFor(() => expect(result.current.messages[0].status).toBe('persisted'));
        expect(result.current.messages[0].id).toBe('srv-99');
        expect(postMessageMock).toHaveBeenCalledTimes(2);
    });

    it('appendAssistant & appendSystem nutzen die richtige Rolle', async () => {
        postMessageMock.mockImplementation((_id, input) =>
            Promise.resolve({
                id:        `srv-${input.role}`,
                role:      input.role,
                content:   input.content,
                metadata:  input.metadata ?? null,
                createdAt: '2026-04-20T10:00:03.000Z',
            }),
        );

        const { result } = renderHook(() => useChatHistory('site-1'));
        await waitFor(() => expect(result.current.messages).toHaveLength(0));

        await act(async () => {
            await result.current.appendAssistant('assistant-antwort', { foo: 'bar' });
            await result.current.appendSystem('system-hinweis');
        });

        await waitFor(() => expect(result.current.messages).toHaveLength(2));
        expect(result.current.messages[0].role).toBe('assistant');
        expect(result.current.messages[0].metadata).toEqual({ foo: 'bar' });
        expect(result.current.messages[1].role).toBe('system');
    });
});
