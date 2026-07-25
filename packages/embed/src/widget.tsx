'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from './ApolloProvider';
import ChatbotClient from './ChatbotClient';

export type AssistlyChatProps = {
  chatbotId: number;
  /** Origin of the Assistly deployment that hosts the chat API, e.g. https://chatbot-xi-rose-68.vercel.app */
  origin: string;
  /** Optional brand color for accents */
  primaryColor?: string;
  /** Fires when the chat panel has mounted and is ready to receive input */
  onReady?: () => void;
  /** Fires if the chat fails to mount */
  onError?: (err: Error) => void;
};

/**
 * Embeddable Assistly chat panel. Renders the full chat UI (intake form +
 * active chat) inside whatever container the customer places it in. Talks
 * directly to the Assistly API at `${origin}/api/...` — no iframe, no
 * cross-origin cookie issues.
 */
export default function AssistlyChat({
  chatbotId,
  origin,
  primaryColor,
  onReady,
  onError,
}: AssistlyChatProps) {
  const client = useMemo(() => createApolloClient(origin), [origin]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    onReady?.();
    try {
      // Reserved for future telemetry.
    } catch (err) {
      onError?.(err as Error);
    }
  }, [onReady, onError]);

  if (!mounted) return null;

  return (
    <ApolloProvider client={client}>
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          // CSS custom property so consumers can theme accents without prop-drilling.
          ...(primaryColor ? ({ '--assistly-primary': primaryColor } as React.CSSProperties) : null),
        }}
      >
        <ChatbotClient id={String(chatbotId)} chatbotName="Assistant" origin={origin} />
      </div>
    </ApolloProvider>
  );
}
