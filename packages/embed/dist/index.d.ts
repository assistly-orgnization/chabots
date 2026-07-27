import React from 'react';

type AssistlyChatProps = {
    chatbotId: number;
    /** Origin of the Assistly deployment that hosts the chat API, e.g. https://chatbot-xi-rose-68.vercel.app */
    origin: string;
    /** Optional brand color for accents (tints the brass accent + online dot) */
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
 *
 * Styling is inlined into the published JS bundle (esbuild `text` loader
 * at build time, injected into <head> on mount). Consumers only need:
 *
 *   import { AssistlyChat } from '@shaimaababiker/embed';
 *
 * Theme tokens are exposed as CSS variables on the root wrapper, e.g.
 * `--assistly-brass`, `--assistly-ink`, `--assistly-paper`, so the host
 * page can override them at any ancestor level.
 */
declare function AssistlyChat({ chatbotId, origin, primaryColor, onReady, onError, }: AssistlyChatProps): React.JSX.Element | null;

export { AssistlyChat, type AssistlyChatProps };
