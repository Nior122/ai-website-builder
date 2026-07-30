// =============================================================================
// Anthropic AI Provider
// =============================================================================
// Thin wrapper around @anthropic-ai/sdk. Only loaded via dynamic import when
// AI_PROVIDER=anthropic is set. This keeps the SDK as an optional dependency —
// projects using OpenRouter never need it installed.
// =============================================================================

import type {
  AIProvider,
  AIProviderConfig,
  CompletionParams,
  StructuredCompletionParams,
  CompletionResult,
  ValidationResult,
} from './types';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private config: AIProviderConfig;
  private client: Promise<any> | null = null;

  constructor(config: AIProviderConfig) {
    if (!config.apiKey) {
      throw new Error(
        'Anthropic API key is missing. Set ANTHROPIC_API_KEY in your environment.'
      );
    }
    this.config = config;
  }

  /**
   * Lazily instantiate the Anthropic SDK.
   * Falls back to a helpful error if the SDK isn't installed.
   */
  private async getClient(): Promise<any> {
    if (this.client) return this.client;

    this.client = (async () => {
      try {
        const Anthropic = await import('@anthropic-ai/sdk');
        return new Anthropic.default({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL || undefined,
        });
      } catch (err) {
        throw new Error(
          'Anthropic SDK not installed. Run `npm install @anthropic-ai/sdk` or switch to OpenRouter.'
        );
      }
    })();

    return this.client;
  }

  async createCompletion(params: CompletionParams): Promise<CompletionResult> {
    const client = await this.getClient();

    const messages: { role: string; content: string }[] = [];
    for (const msg of params.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const response = await client.messages.create({
      model: this.config.model,
      max_tokens: params.maxTokens || this.config.maxTokens,
      temperature: params.temperature ?? this.config.temperature,
      system: params.system || undefined,
      messages,
    });

    const content = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return {
      content,
      usage: response.usage
        ? { inputTokens: response.usage.input_tokens || 0, outputTokens: response.usage.output_tokens || 0 }
        : undefined,
      model: response.model || this.config.model,
    };
  }

  async createStructuredCompletion<T>(params: StructuredCompletionParams): Promise<T> {
    const client = await this.getClient();

    const messages: { role: string; content: string }[] = [];
    for (const msg of params.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const response = await client.messages.create({
      model: this.config.model,
      max_tokens: params.maxTokens || this.config.maxTokens,
      temperature: this.config.temperature,
      system: params.system || undefined,
      messages,
      tools: [
        {
          name: 'structured_output',
          description: 'Return structured data matching the schema',
          input_schema: params.schema,
        },
      ],
      tool_choice: { type: 'tool', name: 'structured_output' },
    });

    // Extract tool use result
    const toolBlock = response.content.find((block: any) => block.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('No tool_use block in Anthropic response');
    }

    return toolBlock.input as T;
  }

  async createStreamCompletion(params: CompletionParams): Promise<ReadableStream<Uint8Array>> {
    const client = await this.getClient();

    const messages: { role: string; content: string }[] = [];
    for (const msg of params.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const stream = await client.messages.stream({
      model: this.config.model,
      max_tokens: params.maxTokens || this.config.maxTokens,
      temperature: params.temperature ?? this.config.temperature,
      system: params.system || undefined,
      messages,
    });

    // Convert Anthropic's MessageStream to a ReadableStream
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        stream.on('text', (text: string) => {
          const data = JSON.stringify({ type: 'content', text });
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        });

        stream.on('end', () => {
          controller.close();
        });

        stream.on('error', (err: Error) => {
          controller.error(err);
        });
      },
      cancel() {
        stream.abort();
      },
    });

    return readable;
  }

  async validate(): Promise<ValidationResult> {
    try {
      const client = await this.getClient();
      await client.messages.create({
        model: this.config.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      return {
        valid: true,
        model: this.config.model,
        provider: this.name,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Validation failed',
        model: this.config.model,
        provider: this.name,
      };
    }
  }
}
