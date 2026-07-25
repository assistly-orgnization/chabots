'use client';

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Message,
  MessagesbyChatSessionIdResponse,
  MessagesbyChatSessionIdResponseVariables,
} from "./types";
import startNewChat from "./lib/startNewChat";
import { GET_MESSEGES_BY_CHAT_SESSION_ID } from "./graphql/queries";
import Avatar from "./ui/Avatar";
import Messages from "./ui/Messages";
import { FormControl, FormField, FormItem, Form, } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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
      content: `Hi there! I'm ${chatbotName}. I'd love to help you out, but first, could you tell me your name?`,
      sender: 'ai',
      created_at: new Date().toISOString(),
      chat_session_id: 0,
    }
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: ''
    }
  });

  const { data } = useQuery<MessagesbyChatSessionIdResponse, MessagesbyChatSessionIdResponseVariables>(
    GET_MESSEGES_BY_CHAT_SESSION_ID,
    {
      variables: { chat_session_id: chatId },
      skip: !chatId
    }
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
        content: `It's a pleasure to meet you, ${formMessage}! Just one more thing—what's your email address so we can stay connected?`,
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

      const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      if (!isValidEmail(formMessage.trim())) {
        setMessage((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            content: "Please enter a valid email address so we can continue.",
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
        const finalEmail = formMessage;
        setEmail(finalEmail);
        const newChatId = await startNewChat(origin, name, finalEmail, Number(id));
        setChatId(newChatId);
        setOnboardingStep(3);

      } catch (error) {
        console.error('Error starting chat:', error);
        setMessage((prev) => [...prev, {
          id: Date.now() + 1,
          content: "Sorry, I had trouble setting up your session. Could you please try entering your email again?",
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
          name: name,
          chat_session_id: chatId,
          chabot_id: Number(id),
          content: formMessage,
          created_at: new Date().toISOString(),
        })
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

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 text-slate-900 md:p-6 md:pb-0">
      <div className="flex flex-col w-full max-w-3xl mx-auto flex-1 overflow-hidden md:rounded-t-2xl border border-gray-200 bg-white relative">
        <div className="border-b border-gray-100 bg-white py-3 px-4 md:py-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
            <div className="relative shrink-0">
              <Avatar
                seed={chatbotName ?? 'default-seed'}
                className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 rounded-full border border-gray-200"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm md:text-base font-semibold text-slate-900">
                {chatbotName || 'Assistant'}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-[11px] font-medium text-slate-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            Secure Session
          </div>
        </div>

        <div className="flex-1 relative bg-white pb-32 md:pb-36 overflow-y-auto">
          <Messages messages={message} chatbotName={chatbotName || ''} />
        </div>

        <div className="absolute bottom-0 w-full bg-white p-3 md:p-6 border-t border-gray-100">
          <Form {...form}>
            <form
              className="relative flex items-center gap-2 md:gap-3 max-w-4xl mx-auto"
              onSubmit={form.handleSubmit(onsubmit)}
            >
              <div className="relative flex-1">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={onboardingStep === 1 ? "Your name..." : onboardingStep === 2 ? "Your email..." : "Type a message..."}
                          className="p-3 md:p-5 rounded-xl bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isValid || loading}
                className="h-12 w-12 md:h-16 md:w-16 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shrink-0"
              >
                {loading ? (
                  <div className="h-6 w-6 md:h-8 md:w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <p className="cursor-pointer text-sm md:text-base">Send</p>)}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default ChatbotClient;
