import * as react_jsx_runtime from 'react/jsx-runtime';

type AssistlyChatProps = {
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
declare function AssistlyChat({ chatbotId, origin, primaryColor, onReady, onError, }: AssistlyChatProps): react_jsx_runtime.JSX.Element | null;

export { AssistlyChat, type AssistlyChatProps };
