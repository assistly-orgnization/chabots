'use client';

import { useEffect, useRef, useState } from "react";
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
import { FormControl, FormField, FormItem, Form } from "./ui/form";
import { Input } from "./ui/input";

type ChatbotClientProps = {
  id: string;
  chatbotName: string;
  origin: string;
};

const formSchema = z.object({
  message: z.string().min(3, 'Your Message is too short!'),
});

function ChatbotClient({ id, chatbotName, origin }: ChatbotClientProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [chatId, setChatId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message[]>([
    {
      id: -1,
      content: `Hi there — I'm ${chatbotName}. I'd love to help, but first, what's your name?`,
      sender: 'ai',
      created_at: new Date().toISOString(),
      chat_session_id: 0,
    }
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
    mode: 'onChange',
  });

  const { data } = useQuery<MessagesbyChatSessionIdResponse, MessagesbyChatSessionIdResponseVariables>(
    GET_MESSEGES_BY_CHAT_SESSION_ID,
    { variables: { chat_session_id: chatId }, skip: !chatId }
  );

  useEffect(() => {
    if (data && onboardingStep === 3) {
      const chatSession = data.chat_sessions as any;
      const dbMessages = chatSession.messages || [];
      setMessage((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = dbMessages.filter((m: Message) => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
    }
  }, [data, onboardingStep]);

  async function onsubmit(values: z.infer<typeof formSchema>) {
    const { message: formMessage } = values;
    form.reset();

    if (onboardingStep === 1) {
      if (!formMessage.trim()) return;
      const userMsg: Message = {
        id: Date.now(),
        content: formMessage,
        chat_session_id: 0,
        sender: 'user',
        created_at: new Date().toISOString(),
      };
      const aiMsg: Message = {
        id: Date.now() + 1,
        content: `Lovely to meet you, ${formMessage}. One more thing — what's your email so we can stay in touch?`,
        chat_session_id: 0,
        sender: 'ai',
        created_at: new Date().toISOString(),
      };
      setName(formMessage);
      setOnboardingStep(2);
      setMessage((prev) => [...prev, userMsg, aiMsg]);
      return;
    }

    if (onboardingStep === 2) {
      if (!formMessage.trim()) return;
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isValidEmail(formMessage.trim())) {
        setMessage((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            content: "That email doesn't look quite right — could you double-check it?",
            chat_session_id: 0,
            sender: 'ai',
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }
      const userMsg: Message = {
        id: Date.now(),
        content: formMessage,
        chat_session_id: 0,
        sender: 'user',
        created_at: new Date().toISOString(),
      };
      setMessage((prev) => [...prev, userMsg]);
      setLoading(true);
      try {
        const newChatId = await startNewChat(origin, name, formMessage, Number(id));
        setEmail(formMessage);
        setChatId(newChatId);
        setOnboardingStep(3);
      } catch (error) {
        console.error('Error starting chat:', error);
        setMessage((prev) => [...prev, {
          id: Date.now() + 1,
          content: "Sorry — I had trouble setting up your session. Mind entering your email again?",
          chat_session_id: 0,
          sender: 'ai',
          created_at: new Date().toISOString(),
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }

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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onsubmit)}
            style={{
              maxWidth: 760,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            <FormField
              control={form.control}
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
                        placeholder={
                          onboardingStep === 1
                            ? 'Your name…'
                            : onboardingStep === 2
                            ? 'Your email…'
                            : 'Write a message…'
                        }
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
              disabled={form.formState.isSubmitting || !form.formState.isValid || loading}
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
    </div>
  );
}

export default ChatbotClient;
