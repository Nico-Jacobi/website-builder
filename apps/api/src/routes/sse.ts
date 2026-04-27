import type { SSEStreamingApi } from 'hono/streaming';

/** Writes a JSON-encoded SSE data event to the stream. */
export function writeSseEvent(stream: SSEStreamingApi, data: unknown): Promise<void> {
    return stream.writeSSE({ data: JSON.stringify(data) });
}

/** Starts a keep-alive comment ping every `intervalMs` milliseconds.
 *  Returns a cleanup function that stops the interval. */
export function startKeepAlive(stream: SSEStreamingApi, intervalMs = 25_000): () => void {
    const id = setInterval(() => {
        void stream.write(': keep-alive\n\n');
    }, intervalMs);
    return () => clearInterval(id);
}
