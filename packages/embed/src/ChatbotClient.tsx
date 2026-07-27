'use client';

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, ShieldCheck, ArrowUpRight } from "lucide-react";

import {
  Message,
  MessagesbyChatSessionIdResponse,
  MessagesbyChatSessionIdResponseVariables,
} from "./types";
import startNewChat from "./lib/startNewChat";
import { GET_MESSEGES_BY_CHAT_SESSION_ID } from "./graphql/queries";
import Messages from "./ui/Messages";
import { FormControl, FormField, FormItem, FormMessage, Form } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type ChatbotClientProps = {
  id: string;
  chatbotName: string;
  origin: string;
};

const messageSchema = z.object({
  message: z.string().min(1, 'Please enter a message.'),
});

const onboardingSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.'),
  email: z.string().trim().email('Please enter a valid email address.'),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

function ChatbotClient({ id, chatbotName, origin }: ChatbotClientProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [chatId, setChatId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [message, setMessage] = useState<Message[]>([]);

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
    mode: 'onChange',
  });

  const onboardingForm = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: '', email: '' },
    mode: 'onChange',
  });

  const { data } = useQuery<MessagesbyChatSessionIdResponse, MessagesbyChatSessionIdResponseVariables>(
    GET_MESSEGES_BY_CHAT_SESSION_ID,
    { variables: { chat_session_id: chatId }, skip: !chatId }
  );

  useEffect(() => {
    if (data && chatId) {
      const chatSession = data.chat_sessions as any;
      const dbMessages = chatSession.messages || [];
      setMessage((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = dbMessages.filter((m: Message) => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
    }
  }, [data, chatId]);

  async function onOnboardingSubmit(values: OnboardingValues) {
    setOnboardingError(null);
    setLoading(true);
    try {
      const newChatId = await startNewChat(origin, values.name, values.email, Number(id));
      setName(values.name);
      setEmail(values.email);
      setChatId(newChatId);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error starting chat:', error);
      setOnboardingError(
        error instanceof Error
          ? error.message
          : 'Sorry — I had trouble setting up your session. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onMessageSubmit(values: z.infer<typeof messageSchema>) {
    const { message: formMessage } = values;
    messageForm.reset();

    if (!chatId) return;
    const userMessage: Message = {
      id: Date.now(),
      content: formMessage,
      chat_session_id: chatId,
      sender: 'user',
      created_at: new Date().toISOString(),
    };
    const loadingMessage: Message = {
      id: Date.now() + 1,
      content: 'Thinking...',
      chat_session_id: chatId,
      created_at: new Date().toISOString(),
      sender: 'ai',
    };
    setMessage((prevMessages) => [...prevMessages, userMessage, loadingMessage]);

    try {
      const baseUrl = origin.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          chat_session_id: chatId,
          chabot_id: Number(id),
          content: formMessage,
          created_at: new Date().toISOString(),
        }),
      });
      const result = await response.json();
      setMessage((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === loadingMessage.id ? { ...msg, content: result.content, id: result.id } : msg
        )
      );
    } catch (error) {
      console.error('Error Sending Message:', error);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Layout                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 520,
        background: 'var(--assistly-paper)',
        color: 'var(--assistly-ink)',
        overflow: 'hidden',
      }}
    >
      <div className="assistly-grain" />

      {/* ======================= HEADER ======================= */}
      <header
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          background: 'var(--assistly-paper)',
          borderBottom: '1px solid var(--assistly-hairline)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div
            style={{
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--assistly-paper-2)',
              border: '1px solid var(--assistly-hairline-strong)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
            aria-hidden
          >
            <span
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 19,
                fontWeight: 500,
                color: 'var(--assistly-ink)',
                letterSpacing: '-0.02em',
              }}
            >
              {chatbotName.charAt(0).toUpperCase()}
            </span>
            <span
              style={{
                position: 'absolute',
                right: -1,
                bottom: -1,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#5a8c5a',
                border: '2px solid var(--assistly-paper)',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              className="assistly-font-display"
              style={{
                fontSize: 17,
                lineHeight: 1.1,
                color: 'var(--assistly-ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {chatbotName}
            </span>
            <span
              className="assistly-font-mono"
              style={{
                fontSize: 10,
                marginTop: 4,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--assistly-ink-mute)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#5a8c5a',
                  display: 'inline-block',
                }}
              />
              Online · replies in seconds
            </span>
          </div>
        </div>

        <div
          className="assistly-font-mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--assistly-ink-soft)',
            background: 'var(--assistly-paper-2)',
            border: '1px solid var(--assistly-hairline)',
            borderRadius: 999,
          }}
        >
          <ShieldCheck size={12} strokeWidth={1.6} style={{ color: 'var(--assistly-brass)' }} />
          Secure
        </div>
      </header>

      {/* ======================= MESSAGES ======================= */}
      <main
        className="assistly-scroll"
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          overflowY: 'auto',
          padding: '28px 20px 24px',
          background: 'transparent',
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <Messages messages={message} chatbotName={chatbotName} />
        </div>
      </main>

      {/* ======================= INPUT ======================= */}
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '16px 20px 22px',
          background: 'linear-gradient(180deg, rgba(245,241,232,0) 0%, var(--assistly-paper) 30%)',
          borderTop: '1px solid var(--assistly-hairline)',
        }}
      >
        <Form {...messageForm}>
          <form
            onSubmit={messageForm.handleSubmit(onMessageSubmit)}
            style={{
              maxWidth: 760,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            <FormField
              control={messageForm.control}
              name="message"
              render={({ field }) => (
                <FormItem style={{ flex: 1, margin: 0 }}>
                  <FormControl>
                    <div
                      style={{
                        position: 'relative',
                        background: '#fffefb',
                        border: '1px solid var(--assistly-hairline-strong)',
                        borderRadius: 14,
                        boxShadow: '0 1px 0 rgba(26,20,15,0.02), 0 6px 18px rgba(26,20,15,0.04)',
                        transition: 'border-color 180ms ease, box-shadow 180ms ease',
                      }}
                    >
                      <Input
                        {...field}
                        placeholder="Write a message…"
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: 'var(--assistly-ink)',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontFamily: 'inherit',
                          borderRadius: 14,
                        }}
                        onFocus={(e) => {
                          const wrap = e.currentTarget.parentElement as HTMLElement;
                          wrap.style.borderColor = 'var(--assistly-brass)';
                          wrap.style.boxShadow = '0 0 0 3px rgba(184,137,58,0.18), 0 6px 18px rgba(26,20,15,0.04)';
                        }}
                        onBlur={(e) => {
                          const wrap = e.currentTarget.parentElement as HTMLElement;
                          wrap.style.borderColor = 'var(--assistly-hairline-strong)';
                          wrap.style.boxShadow = '0 1px 0 rgba(26,20,15,0.02), 0 6px 18px rgba(26,20,15,0.04)';
                        }}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={messageForm.formState.isSubmitting || !messageForm.formState.isValid || loading}
              className="assistly-send"
              aria-label="Send message"
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {loading ? (
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(245,241,232,0.35)',
                    borderTopColor: 'var(--assistly-paper)',
                    borderRadius: '50%',
                    animation: 'assistly-spin 0.9s linear infinite',
                    display: 'inline-block',
                  }}
                />
              ) : (
                <Send size={18} strokeWidth={2} />
              )}
            </button>
          </form>
        </Form>
        <span
          className="assistly-font-mono"
          style={{
            display: 'block',
            maxWidth: 760,
            margin: '10px auto 0',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--assistly-ink-mute)',
            textAlign: 'center',
          }}
        >
          <ArrowUpRight size={10} strokeWidth={1.8} style={{ verticalAlign: '-1px', marginRight: 4 }} />
          Powered by SMOEDESIGN
        </span>
        <style>{`@keyframes assistly-spin { to { transform: rotate(360deg); } }`}</style>
      </footer>

      {/* ======================= ONBOARDING MODAL ======================= */}
      {showOnboarding && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistly-onboarding-title"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(26,20,15,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--assistly-paper)',
              border: '1px solid var(--assistly-hairline-strong)',
              borderRadius: 18,
              boxShadow: '0 24px 60px rgba(26,20,15,0.18)',
              padding: '28px 28px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--assistly-paper-2)',
                  border: '1px solid var(--assistly-hairline-strong)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 18,
                  color: 'var(--assistly-ink)',
                }}
                aria-hidden
              >
                {chatbotName.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <h2
                  id="assistly-onboarding-title"
                  className="assistly-font-display"
                  style={{
                    fontSize: 17,
                    lineHeight: 1.2,
                    color: 'var(--assistly-ink)',
                    margin: 0,
                  }}
                >
                  Welcome — let's get started
                </h2>
                <p
                  className="assistly-font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--assistly-ink-mute)',
                    margin: '4px 0 0',
                  }}
                >
                  Chatting with {chatbotName}
                </p>
              </div>
            </div>

            <Form {...onboardingForm}>
              <form
                onSubmit={onboardingForm.handleSubmit(onOnboardingSubmit)}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <FormField
                  control={onboardingForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem style={{ margin: 0 }}>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Name"
                          autoComplete="name"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: 15,
                            color: 'var(--assistly-ink)',
                            background: '#fffefb',
                            border: '1px solid var(--assistly-hairline-strong)',
                            borderRadius: 12,
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={onboardingForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem style={{ margin: 0 }}>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Email"
                          autoComplete="email"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: 15,
                            color: 'var(--assistly-ink)',
                            background: '#fffefb',
                            border: '1px solid var(--assistly-hairline-strong)',
                            borderRadius: 12,
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {onboardingError && (
                  <p
                    role="alert"
                    className="assistly-font-mono"
                    style={{
                      fontSize: 11,
                      color: '#a23a2a',
                      margin: 0,
                    }}
                  >
                    {onboardingError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !onboardingForm.formState.isValid}
                  className="assistly-send"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    border: 'none',
                    cursor: loading ? 'wait' : 'pointer',
                    color: 'var(--assistly-paper)',
                    background: 'var(--assistly-ink)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: '2px solid rgba(245,241,232,0.35)',
                          borderTopColor: 'var(--assistly-paper)',
                          borderRadius: '50%',
                          animation: 'assistly-spin 0.9s linear infinite',
                          display: 'inline-block',
                        }}
                      />
                      Starting chat…
                    </>
                  ) : (
                    'Start chatting'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatbotClient;
