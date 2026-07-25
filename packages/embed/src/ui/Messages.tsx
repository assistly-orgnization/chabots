'use client';

import { Message } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function TypewriterMarkdown({
  text,
  isFresh,
  components,
  onType,
}: {
  text: string;
  isFresh: boolean;
  components: any;
  onType?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (isFresh && text && index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
        if (onType) onType();
      }, 14);
      return () => clearTimeout(timeout);
    } else if (!isFresh) {
      setDisplayedText(text || "");
    }
  }, [index, text, isFresh]);

  const showCaret = isFresh && index < text.length;
  return (
    <span className={showCaret ? 'assistly-caret' : undefined}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {isFresh ? displayedText : text}
      </ReactMarkdown>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

function Messages({
  messages,
  chatbotName,
  isReviewPage = false,
}: {
  messages: Message[];
  chatbotName: string;
  isReviewPage?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  const scrollToBottom = (smooth = true) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markdownComponents = {
    ul: ({ node, ...props }: any) => <ul {...props} />,
    ol: ({ node, ...props }: any) => <ol {...props} />,
    a: ({ node, ...props }: any) => <a rel="noopener noreferrer" target="_blank" {...props} />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {messages.map((message, index) => {
        const isSender = message.sender !== "user";
        const isThinking = message.content === "" || message.content === "Thinking...";
        const isFresh = index === messages.length - 1;
        const showMeta = hoveredId === message.id || isReviewPage;

        return (
          <div
            key={message.id || index}
            onMouseEnter={() => setHoveredId(message.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isSender ? 'flex-start' : 'flex-end',
              maxWidth: '100%',
            }}
          >
            {/* ----- Header row: avatar + name + meta ----- */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
                padding: isSender ? '0 4px' : '0 4px',
                flexDirection: isSender ? 'row' : 'row-reverse',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isSender
                    ? 'var(--assistly-paper-2)'
                    : 'var(--assistly-ink)',
                  color: isSender ? 'var(--assistly-ink)' : 'var(--assistly-paper)',
                  border: '1px solid var(--assistly-hairline-strong)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
                aria-hidden
              >
                {isSender ? (
                  <span
                    style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {chatbotName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <UserCircle size={14} strokeWidth={1.6} />
                )}
              </div>
              <div
                className="assistly-font-mono"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--assistly-ink-mute)',
                }}
              >
                <span style={{ color: 'var(--assistly-ink-soft)', fontWeight: 500 }}>
                  {isSender ? chatbotName || 'assistant' : 'you'}
                </span>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: 'var(--assistly-ink-mute)',
                    opacity: showMeta ? 1 : 0,
                    transition: 'opacity 200ms',
                  }}
                />
                <span style={{ opacity: showMeta ? 1 : 0, transition: 'opacity 200ms' }}>
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>

            {/* ----- Bubble ----- */}
            <div
              className={`${isSender ? 'assistly-bubble-in' : ''}`}
              style={{
                position: 'relative',
                maxWidth: 'min(82%, 640px)',
                padding: '12px 16px',
                borderRadius: isSender ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                background: isSender ? '#fffefb' : 'var(--assistly-ink)',
                color: isSender ? 'var(--assistly-ink)' : 'var(--assistly-paper)',
                border: isSender
                  ? '1px solid var(--assistly-hairline-strong)'
                  : '1px solid var(--assistly-ink)',
                boxShadow: isSender
                  ? '0 1px 0 rgba(26,20,15,0.02), 0 8px 24px rgba(26,20,15,0.05)'
                  : '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(26,20,15,0.18)',
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              {isThinking ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '2px 0',
                    minHeight: 22,
                  }}
                >
                  <span className="assistly-dot" />
                  <span className="assistly-dot" />
                  <span className="assistly-dot" />
                  <span className="assistly-dot" />
                  <span
                    className="assistly-font-mono"
                    style={{
                      marginLeft: 4,
                      fontSize: 10,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'var(--assistly-ink-mute)',
                    }}
                  >
                    Thinking…
                  </span>
                </div>
              ) : isSender ? (
                <div className="assistly-prose">
                  <TypewriterMarkdown
                    text={message.content}
                    isFresh={isFresh}
                    components={markdownComponents}
                    onType={() => scrollToBottom(false)}
                  />
                </div>
              ) : (
                <div className="assistly-prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={ref} />
    </div>
  );
}

export default Messages;
