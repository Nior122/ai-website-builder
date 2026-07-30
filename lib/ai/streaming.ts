// =============================================================================
// Streaming Response Utilities
// =============================================================================
// Helpers for creating and managing SSE (Server-Sent Events) streams
// for real-time AI generation progress updates.
// =============================================================================

/**
 * Create an SSE event stream from a ReadableStream.
 */
export function createEventStream(): {
  stream: ReadableStream;
  send: (event: string, data: unknown) => void;
  complete: () => void;
  error: (message: string) => void;
} {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let encoder: TextEncoder;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      encoder = new TextEncoder();
    },
    cancel() {
      controller.close();
    },
  });

  function send(event: string, data: unknown) {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(payload));
    } catch {
      // Stream may be closed
    }
  }

  function complete() {
    send('complete', { status: 'done' });
    controller.close();
  }

  function error(message: string) {
    send('error', { message });
    controller.close();
  }

  return { stream, send, complete, error };
}

/**
 * Parse SSE events from a fetch response.
 */
export async function* parseEventStream(
  response: Response
): AsyncGenerator<{ event: string; data: unknown }> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7);
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            yield { event: currentEvent, data: JSON.parse(data) };
          } catch {
            yield { event: currentEvent, data };
          }
          currentEvent = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
