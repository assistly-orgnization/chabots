var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// src/widget.tsx
import { useEffect as useEffect3, useMemo, useState as useState3 } from "react";
import { ApolloProvider } from "@apollo/client";

// src/ApolloProvider.tsx
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
var defaultOptions = {
  watchQuery: { fetchPolicy: "no-cache", errorPolicy: "all" },
  query: { fetchPolicy: "no-cache", errorPolicy: "all" },
  mutate: { fetchPolicy: "no-cache", errorPolicy: "all" }
};
function createApolloClient(origin) {
  const baseUrl = origin.replace(/\/$/, "");
  return new ApolloClient({
    link: createHttpLink({ uri: `${baseUrl}/api/graphql` }),
    cache: new InMemoryCache(),
    defaultOptions
  });
}

// src/ChatbotClient.tsx
import { useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";
import { useQuery } from "@apollo/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, ShieldCheck, ArrowUpRight } from "lucide-react";

// src/lib/startNewChat.ts
async function startNewChat(origin, guestName, guestEmail, chatbotId) {
  var _a;
  const baseUrl = origin.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/start-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: guestName,
      email: guestEmail,
      chatbot_id: chatbotId
    })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = (_a = payload == null ? void 0 : payload.error) != null ? _a : `Failed to start chat (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  if (typeof (data == null ? void 0 : data.chat_session_id) !== "number") {
    throw new Error("Server returned an invalid response");
  }
  return data.chat_session_id;
}
var startNewChat_default = startNewChat;

// src/graphql/queries.ts
import { gql } from "@apollo/client";
var GET_MESSEGES_BY_CHAT_SESSION_ID = gql`
  query GetMessagesByChatSessionId($chat_session_id: Int!) {
    chat_sessions(id: $chat_session_id) {
      created_at
      id
      messages {
        id
        sender
        content
        created_at
      }
    }
  }
`;

// src/ui/Messages.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}
function TypewriterMarkdown({
  text,
  isFresh,
  components,
  onType
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
  return /* @__PURE__ */ jsx("span", { className: showCaret ? "assistly-caret" : void 0, children: /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components, children: isFresh ? displayedText : text }) });
}
function Messages({
  messages,
  chatbotName,
  isReviewPage = false
}) {
  const ref = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const scrollToBottom = (smooth = true) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const markdownComponents = {
    ul: (_a) => {
      var _b = _a, { node } = _b, props = __objRest(_b, ["node"]);
      return /* @__PURE__ */ jsx("ul", __spreadValues({}, props));
    },
    ol: (_c) => {
      var _d = _c, { node } = _d, props = __objRest(_d, ["node"]);
      return /* @__PURE__ */ jsx("ol", __spreadValues({}, props));
    },
    a: (_e) => {
      var _f = _e, { node } = _f, props = __objRest(_f, ["node"]);
      return /* @__PURE__ */ jsx("a", __spreadValues({ rel: "noopener noreferrer", target: "_blank" }, props));
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 22 }, children: [
    messages.map((message, index) => {
      const isSender = message.sender !== "user";
      const isThinking = message.content === "" || message.content === "Thinking...";
      const isFresh = index === messages.length - 1;
      const showMeta = hoveredId === message.id || isReviewPage;
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onMouseEnter: () => setHoveredId(message.id),
          onMouseLeave: () => setHoveredId(null),
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: isSender ? "flex-start" : "flex-end",
            maxWidth: "100%"
          },
          children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                  padding: isSender ? "0 4px" : "0 4px",
                  flexDirection: isSender ? "row" : "row-reverse"
                },
                children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: isSender ? "var(--assistly-paper-2)" : "var(--assistly-ink)",
                        color: isSender ? "var(--assistly-ink)" : "var(--assistly-paper)",
                        border: "1px solid var(--assistly-hairline-strong)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0
                      },
                      "aria-hidden": true,
                      children: isSender ? /* @__PURE__ */ jsx(
                        "span",
                        {
                          style: {
                            fontFamily: "Fraunces, Georgia, serif",
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: 1
                          },
                          children: chatbotName.charAt(0).toUpperCase()
                        }
                      ) : /* @__PURE__ */ jsx(UserCircle, { size: 14, strokeWidth: 1.6 })
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "assistly-font-mono",
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--assistly-ink-mute)"
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { style: { color: "var(--assistly-ink-soft)", fontWeight: 500 }, children: isSender ? chatbotName || "assistant" : "you" }),
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            style: {
                              width: 3,
                              height: 3,
                              borderRadius: "50%",
                              background: "var(--assistly-ink-mute)",
                              opacity: showMeta ? 1 : 0,
                              transition: "opacity 200ms"
                            }
                          }
                        ),
                        /* @__PURE__ */ jsx("span", { style: { opacity: showMeta ? 1 : 0, transition: "opacity 200ms" }, children: formatTime(message.created_at) })
                      ]
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `${isSender ? "assistly-bubble-in" : ""}`,
                style: {
                  position: "relative",
                  maxWidth: "min(82%, 640px)",
                  padding: "12px 16px",
                  borderRadius: isSender ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                  background: isSender ? "#fffefb" : "var(--assistly-ink)",
                  color: isSender ? "var(--assistly-ink)" : "var(--assistly-paper)",
                  border: isSender ? "1px solid var(--assistly-hairline-strong)" : "1px solid var(--assistly-ink)",
                  boxShadow: isSender ? "0 1px 0 rgba(26,20,15,0.02), 0 8px 24px rgba(26,20,15,0.05)" : "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(26,20,15,0.18)",
                  fontSize: 15,
                  lineHeight: 1.6
                },
                children: isThinking ? /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "2px 0",
                      minHeight: 22
                    },
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "assistly-dot" }),
                      /* @__PURE__ */ jsx("span", { className: "assistly-dot" }),
                      /* @__PURE__ */ jsx("span", { className: "assistly-dot" }),
                      /* @__PURE__ */ jsx("span", { className: "assistly-dot" }),
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: "assistly-font-mono",
                          style: {
                            marginLeft: 4,
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "var(--assistly-ink-mute)"
                          },
                          children: "Thinking\u2026"
                        }
                      )
                    ]
                  }
                ) : isSender ? /* @__PURE__ */ jsx("div", { className: "assistly-prose", children: /* @__PURE__ */ jsx(
                  TypewriterMarkdown,
                  {
                    text: message.content,
                    isFresh,
                    components: markdownComponents,
                    onType: () => scrollToBottom(false)
                  }
                ) }) : /* @__PURE__ */ jsx("div", { className: "assistly-prose", children: /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components: markdownComponents, children: message.content }) })
              }
            )
          ]
        },
        message.id || index
      );
    }),
    /* @__PURE__ */ jsx("div", { ref })
  ] });
}
var Messages_default = Messages;

// src/ui/form.tsx
import * as React2 from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState
} from "react-hook-form";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/ui/label.tsx
import * as LabelPrimitive from "@radix-ui/react-label";
import { jsx as jsx2 } from "react/jsx-runtime";

// src/ui/form.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var Form = FormProvider;
var FormFieldContext = React2.createContext(
  {}
);
var FormField = (_a) => {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx3(FormFieldContext.Provider, { value: { name: props.name }, children: /* @__PURE__ */ jsx3(Controller, __spreadValues({}, props)) });
};
var useFormField = () => {
  const fieldContext = React2.useContext(FormFieldContext);
  const itemContext = React2.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  const { id } = itemContext;
  return __spreadValues({
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`
  }, fieldState);
};
var FormItemContext = React2.createContext(
  {}
);
function FormItem(_a) {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  const id = React2.useId();
  return /* @__PURE__ */ jsx3(FormItemContext.Provider, { value: { id }, children: /* @__PURE__ */ jsx3(
    "div",
    __spreadValues({
      "data-slot": "form-item",
      className: cn("grid gap-2", className)
    }, props)
  ) });
}
function FormControl(_a) {
  var props = __objRest(_a, []);
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return /* @__PURE__ */ jsx3(
    Slot,
    __spreadValues({
      "data-slot": "form-control",
      id: formItemId,
      "aria-describedby": !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`,
      "aria-invalid": !!error
    }, props)
  );
}
function FormMessage(_a) {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  var _a2;
  const { error, formMessageId } = useFormField();
  const body = error ? String((_a2 = error == null ? void 0 : error.message) != null ? _a2 : "") : props.children;
  if (!body) {
    return null;
  }
  return /* @__PURE__ */ jsx3(
    "p",
    __spreadProps(__spreadValues({
      "data-slot": "form-message",
      id: formMessageId,
      className: cn("text-destructive text-sm", className)
    }, props), {
      children: body
    })
  );
}

// src/ui/input.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function Input(_a) {
  var _b = _a, { className, type } = _b, props = __objRest(_b, ["className", "type"]);
  return /* @__PURE__ */ jsx4(
    "input",
    __spreadValues({
      type,
      "data-slot": "input",
      className: cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )
    }, props)
  );
}

// src/ui/button.tsx
import { Slot as Slot2 } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { jsx as jsx5 } from "react/jsx-runtime";
var buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-3",
        icon: "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button(_a) {
  var _b = _a, {
    className,
    variant,
    size,
    asChild = false
  } = _b, props = __objRest(_b, [
    "className",
    "variant",
    "size",
    "asChild"
  ]);
  const Comp = asChild ? Slot2 : "button";
  return /* @__PURE__ */ jsx5(
    Comp,
    __spreadValues({
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className }))
    }, props)
  );
}

// src/ChatbotClient.tsx
import { Fragment, jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";
var messageSchema = z.object({
  message: z.string().min(1, "Please enter a message.")
});
var onboardingSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address.")
});
function ChatbotClient({ id, chatbotName, origin }) {
  const [name, setName] = useState2("");
  const [email, setEmail] = useState2("");
  const [chatId, setChatId] = useState2(0);
  const [loading, setLoading] = useState2(false);
  const [onboardingError, setOnboardingError] = useState2(null);
  const [showOnboarding, setShowOnboarding] = useState2(true);
  const [message, setMessage] = useState2([]);
  const bottomRef = useRef2(null);
  useEffect2(() => {
    var _a;
    (_a = bottomRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  }, [message]);
  const messageForm = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
    mode: "onChange"
  });
  const onboardingForm = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: "", email: "" },
    mode: "onChange"
  });
  const { data } = useQuery(
    GET_MESSEGES_BY_CHAT_SESSION_ID,
    { variables: { chat_session_id: chatId }, skip: !chatId }
  );
  useEffect2(() => {
    if (data && chatId) {
      const chatSession = data.chat_sessions;
      const dbMessages = chatSession.messages || [];
      setMessage((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = dbMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
    }
  }, [data, chatId]);
  async function onOnboardingSubmit(values) {
    setOnboardingError(null);
    setLoading(true);
    try {
      const newChatId = await startNewChat_default(origin, values.name, values.email, Number(id));
      setName(values.name);
      setEmail(values.email);
      setChatId(newChatId);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error starting chat:", error);
      setOnboardingError(
        error instanceof Error ? error.message : "Sorry \u2014 I had trouble setting up your session. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }
  async function onMessageSubmit(values) {
    const { message: formMessage } = values;
    messageForm.reset();
    if (!chatId) return;
    const userMessage = {
      id: Date.now(),
      content: formMessage,
      chat_session_id: chatId,
      sender: "user",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const loadingMessage = {
      id: Date.now() + 1,
      content: "Thinking...",
      chat_session_id: chatId,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      sender: "ai"
    };
    setMessage((prevMessages) => [...prevMessages, userMessage, loadingMessage]);
    try {
      const baseUrl = origin.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/api/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          chat_session_id: chatId,
          chabot_id: Number(id),
          content: formMessage,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        })
      });
      const result = await response.json();
      setMessage(
        (prevMessages) => prevMessages.map(
          (msg) => msg.id === loadingMessage.id ? __spreadProps(__spreadValues({}, msg), { content: result.content, id: result.id }) : msg
        )
      );
    } catch (error) {
      console.error("Error Sending Message:", error);
    }
  }
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 520,
        background: "var(--assistly-paper)",
        color: "var(--assistly-ink)",
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ jsx6("div", { className: "assistly-grain" }),
        /* @__PURE__ */ jsxs2(
          "header",
          {
            style: {
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px",
              background: "var(--assistly-paper)",
              borderBottom: "1px solid var(--assistly-hairline)"
            },
            children: [
              /* @__PURE__ */ jsxs2("div", { style: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxs2(
                  "div",
                  {
                    style: {
                      position: "relative",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "var(--assistly-paper-2)",
                      border: "1px solid var(--assistly-hairline-strong)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0
                    },
                    "aria-hidden": true,
                    children: [
                      /* @__PURE__ */ jsx6(
                        "span",
                        {
                          style: {
                            fontFamily: "Fraunces, Georgia, serif",
                            fontSize: 19,
                            fontWeight: 500,
                            color: "var(--assistly-ink)",
                            letterSpacing: "-0.02em"
                          },
                          children: chatbotName.charAt(0).toUpperCase()
                        }
                      ),
                      /* @__PURE__ */ jsx6(
                        "span",
                        {
                          style: {
                            position: "absolute",
                            right: -1,
                            bottom: -1,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: "#5a8c5a",
                            border: "2px solid var(--assistly-paper)"
                          }
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexDirection: "column", minWidth: 0 }, children: [
                  /* @__PURE__ */ jsx6(
                    "span",
                    {
                      className: "assistly-font-display",
                      style: {
                        fontSize: 17,
                        lineHeight: 1.1,
                        color: "var(--assistly-ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      },
                      children: chatbotName
                    }
                  ),
                  /* @__PURE__ */ jsxs2(
                    "span",
                    {
                      className: "assistly-font-mono",
                      style: {
                        fontSize: 10,
                        marginTop: 4,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--assistly-ink-mute)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      },
                      children: [
                        /* @__PURE__ */ jsx6(
                          "span",
                          {
                            style: {
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#5a8c5a",
                              display: "inline-block"
                            }
                          }
                        ),
                        "Online \xB7 replies in seconds"
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs2(
                "div",
                {
                  className: "assistly-font-mono",
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--assistly-ink-soft)",
                    background: "var(--assistly-paper-2)",
                    border: "1px solid var(--assistly-hairline)",
                    borderRadius: 999
                  },
                  children: [
                    /* @__PURE__ */ jsx6(ShieldCheck, { size: 12, strokeWidth: 1.6, style: { color: "var(--assistly-brass)" } }),
                    "Secure"
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx6(
          "main",
          {
            className: "assistly-scroll",
            style: {
              position: "relative",
              zIndex: 1,
              flex: 1,
              minHeight: "95vh",
              overflowY: "auto",
              padding: "28px 20px 24px",
              background: "transparent"
            },
            children: /* @__PURE__ */ jsxs2(
              "div",
              {
                style: {
                  maxWidth: 760,
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18
                },
                children: [
                  /* @__PURE__ */ jsx6(Messages_default, { messages: message, chatbotName }),
                  /* @__PURE__ */ jsx6("div", { ref: bottomRef, style: { height: 4 } })
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs2(
          "footer",
          {
            style: {
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
              padding: "16px 20px 22px",
              background: "linear-gradient(180deg, rgba(245,241,232,0) 0%, var(--assistly-paper) 30%)",
              borderTop: "1px solid var(--assistly-hairline)"
            },
            children: [
              /* @__PURE__ */ jsx6(Form, __spreadProps(__spreadValues({}, messageForm), { children: /* @__PURE__ */ jsxs2(
                "form",
                {
                  onSubmit: messageForm.handleSubmit(onMessageSubmit),
                  style: {
                    maxWidth: 760,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 10
                  },
                  children: [
                    /* @__PURE__ */ jsx6(
                      FormField,
                      {
                        control: messageForm.control,
                        name: "message",
                        render: ({ field }) => /* @__PURE__ */ jsx6(FormItem, { style: { flex: 1, margin: 0 }, children: /* @__PURE__ */ jsx6(FormControl, { children: /* @__PURE__ */ jsx6(
                          "div",
                          {
                            style: {
                              position: "relative",
                              background: "#fffefb",
                              border: "1px solid var(--assistly-hairline-strong)",
                              borderRadius: 14,
                              boxShadow: "0 1px 0 rgba(26,20,15,0.02), 0 6px 18px rgba(26,20,15,0.04)",
                              transition: "border-color 180ms ease, box-shadow 180ms ease"
                            },
                            children: /* @__PURE__ */ jsx6(
                              Input,
                              __spreadProps(__spreadValues({}, field), {
                                placeholder: "Write a message\u2026",
                                style: {
                                  width: "100%",
                                  padding: "14px 16px",
                                  fontSize: 15,
                                  lineHeight: 1.5,
                                  color: "var(--assistly-ink)",
                                  background: "transparent",
                                  border: "none",
                                  outline: "none",
                                  fontFamily: "inherit",
                                  borderRadius: 14
                                },
                                onFocus: (e) => {
                                  const wrap = e.currentTarget.parentElement;
                                  wrap.style.borderColor = "var(--assistly-brass)";
                                  wrap.style.boxShadow = "0 0 0 3px rgba(184,137,58,0.18), 0 6px 18px rgba(26,20,15,0.04)";
                                },
                                onBlur: (e) => {
                                  const wrap = e.currentTarget.parentElement;
                                  wrap.style.borderColor = "var(--assistly-hairline-strong)";
                                  wrap.style.boxShadow = "0 1px 0 rgba(26,20,15,0.02), 0 6px 18px rgba(26,20,15,0.04)";
                                }
                              })
                            )
                          }
                        ) }) })
                      }
                    ),
                    /* @__PURE__ */ jsx6(
                      "button",
                      {
                        type: "submit",
                        disabled: messageForm.formState.isSubmitting || !messageForm.formState.isValid || loading,
                        className: "assistly-send",
                        "aria-label": "Send message",
                        style: {
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          border: "none",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0
                        },
                        children: loading ? /* @__PURE__ */ jsx6(
                          "span",
                          {
                            style: {
                              width: 18,
                              height: 18,
                              border: "2px solid rgba(245,241,232,0.35)",
                              borderTopColor: "var(--assistly-paper)",
                              borderRadius: "50%",
                              animation: "assistly-spin 0.9s linear infinite",
                              display: "inline-block"
                            }
                          }
                        ) : /* @__PURE__ */ jsx6(Send, { size: 18, strokeWidth: 2 })
                      }
                    )
                  ]
                }
              ) })),
              /* @__PURE__ */ jsxs2(
                "span",
                {
                  className: "assistly-font-mono",
                  style: {
                    display: "block",
                    maxWidth: 760,
                    margin: "10px auto 0",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--assistly-ink-mute)",
                    textAlign: "center"
                  },
                  children: [
                    /* @__PURE__ */ jsx6(ArrowUpRight, { size: 10, strokeWidth: 1.8, style: { verticalAlign: "-1px", marginRight: 4 } }),
                    "Powered by SMOEDESIGN"
                  ]
                }
              ),
              /* @__PURE__ */ jsx6("style", { children: `@keyframes assistly-spin { to { transform: rotate(360deg); } }` })
            ]
          }
        ),
        showOnboarding && /* @__PURE__ */ jsx6(
          "div",
          {
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "assistly-onboarding-title",
            style: {
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(26,20,15,0.45)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              padding: 20
            },
            children: /* @__PURE__ */ jsxs2(
              "div",
              {
                style: {
                  width: "100%",
                  maxWidth: 420,
                  background: "var(--assistly-paper)",
                  border: "1px solid var(--assistly-hairline-strong)",
                  borderRadius: 18,
                  boxShadow: "0 24px 60px rgba(26,20,15,0.18)",
                  padding: "28px 28px 24px"
                },
                children: [
                  /* @__PURE__ */ jsxs2("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }, children: [
                    /* @__PURE__ */ jsx6(
                      "div",
                      {
                        style: {
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "var(--assistly-paper-2)",
                          border: "1px solid var(--assistly-hairline-strong)",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          fontFamily: "Fraunces, Georgia, serif",
                          fontSize: 18,
                          color: "var(--assistly-ink)"
                        },
                        "aria-hidden": true,
                        children: chatbotName.charAt(0).toUpperCase()
                      }
                    ),
                    /* @__PURE__ */ jsxs2("div", { style: { minWidth: 0 }, children: [
                      /* @__PURE__ */ jsx6(
                        "h2",
                        {
                          id: "assistly-onboarding-title",
                          className: "assistly-font-display",
                          style: {
                            fontSize: 17,
                            lineHeight: 1.2,
                            color: "var(--assistly-ink)",
                            margin: 0
                          },
                          children: "Welcome \u2014 let's get started"
                        }
                      ),
                      /* @__PURE__ */ jsxs2(
                        "p",
                        {
                          className: "assistly-font-mono",
                          style: {
                            fontSize: 10,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "var(--assistly-ink-mute)",
                            margin: "4px 0 0"
                          },
                          children: [
                            "Chatting with ",
                            chatbotName
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx6(Form, __spreadProps(__spreadValues({}, onboardingForm), { children: /* @__PURE__ */ jsxs2(
                    "form",
                    {
                      onSubmit: onboardingForm.handleSubmit(onOnboardingSubmit),
                      style: { display: "flex", flexDirection: "column", gap: 14 },
                      children: [
                        /* @__PURE__ */ jsx6(
                          FormField,
                          {
                            control: onboardingForm.control,
                            name: "name",
                            render: ({ field }) => /* @__PURE__ */ jsxs2(FormItem, { style: { margin: 0 }, children: [
                              /* @__PURE__ */ jsx6(FormControl, { children: /* @__PURE__ */ jsx6(
                                Input,
                                __spreadProps(__spreadValues({}, field), {
                                  placeholder: "Name",
                                  autoComplete: "name",
                                  style: {
                                    width: "100%",
                                    padding: "12px 14px",
                                    fontSize: 15,
                                    color: "var(--assistly-ink)",
                                    background: "#fffefb",
                                    border: "1px solid var(--assistly-hairline-strong)",
                                    borderRadius: 12,
                                    outline: "none",
                                    fontFamily: "inherit"
                                  }
                                })
                              ) }),
                              /* @__PURE__ */ jsx6(FormMessage, {})
                            ] })
                          }
                        ),
                        /* @__PURE__ */ jsx6(
                          FormField,
                          {
                            control: onboardingForm.control,
                            name: "email",
                            render: ({ field }) => /* @__PURE__ */ jsxs2(FormItem, { style: { margin: 0 }, children: [
                              /* @__PURE__ */ jsx6(FormControl, { children: /* @__PURE__ */ jsx6(
                                Input,
                                __spreadProps(__spreadValues({}, field), {
                                  type: "email",
                                  placeholder: "Email",
                                  autoComplete: "email",
                                  style: {
                                    width: "100%",
                                    padding: "12px 14px",
                                    fontSize: 15,
                                    color: "var(--assistly-ink)",
                                    background: "#fffefb",
                                    border: "1px solid var(--assistly-hairline-strong)",
                                    borderRadius: 12,
                                    outline: "none",
                                    fontFamily: "inherit"
                                  }
                                })
                              ) }),
                              /* @__PURE__ */ jsx6(FormMessage, {})
                            ] })
                          }
                        ),
                        onboardingError && /* @__PURE__ */ jsx6(
                          "p",
                          {
                            role: "alert",
                            className: "assistly-font-mono",
                            style: {
                              fontSize: 11,
                              color: "#a23a2a",
                              margin: 0
                            },
                            children: onboardingError
                          }
                        ),
                        /* @__PURE__ */ jsx6(
                          Button,
                          {
                            type: "submit",
                            disabled: loading || !onboardingForm.formState.isValid,
                            className: "assistly-send",
                            style: {
                              width: "100%",
                              height: 48,
                              borderRadius: 12,
                              border: "none",
                              cursor: loading ? "wait" : "pointer",
                              color: "var(--assistly-paper)",
                              background: "var(--assistly-ink)",
                              fontFamily: "inherit",
                              fontSize: 14,
                              fontWeight: 500,
                              letterSpacing: "0.04em",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                              marginTop: 4
                            },
                            children: loading ? /* @__PURE__ */ jsxs2(Fragment, { children: [
                              /* @__PURE__ */ jsx6(
                                "span",
                                {
                                  style: {
                                    width: 14,
                                    height: 14,
                                    border: "2px solid rgba(245,241,232,0.35)",
                                    borderTopColor: "var(--assistly-paper)",
                                    borderRadius: "50%",
                                    animation: "assistly-spin 0.9s linear infinite",
                                    display: "inline-block"
                                  }
                                }
                              ),
                              "Starting chat\u2026"
                            ] }) : "Start chatting"
                          }
                        )
                      ]
                    }
                  ) }))
                ]
              }
            )
          }
        )
      ]
    }
  );
}
var ChatbotClient_default = ChatbotClient;

// src/lib/injectStyles.ts
var injected = false;
var injectedHash = null;
function hashCss(css) {
  let h = 5381;
  for (let i = 0; i < css.length; i++) {
    h = (h << 5) + h ^ css.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}
function ensureAssistlyStyles(css) {
  if (typeof document === "undefined") return;
  const h = hashCss(css);
  if (injected && injectedHash === h) return;
  injected = true;
  injectedHash = h;
  document.querySelectorAll("style[data-assistly-style]").forEach((el) => el.remove());
  const style = document.createElement("style");
  style.setAttribute("data-assistly-style", h);
  style.textContent = css;
  document.head.appendChild(style);
}
var fontsInjected = false;
var FONT_HREF = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
function ensureAssistlyFonts() {
  if (typeof document === "undefined") return;
  if (fontsInjected) return;
  if (document.querySelector("link[data-assistly-fonts]")) {
    fontsInjected = true;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  link.setAttribute("data-assistly-fonts", "true");
  document.head.appendChild(link);
  fontsInjected = true;
}

// src/styles.tokens
var styles_default = `/* Assistly embed \u2014 base styles
 * ------------------------------------------------------------
 * This file is compiled at build time and injected into the
 * consumer page on mount. It defines the design tokens the
 * React components reference (shadcn-style + custom palette)
 * so the widget renders identically regardless of the host
 * app's Tailwind/theme configuration.
 */

:root {
  /* --- Paper & ink palette --------------------------------- */
  --assistly-paper: #f5f1e8;          /* warm bone */
  --assistly-paper-2: #efe9dc;        /* slightly deeper bone */
  --assistly-ink: #1a140f;            /* near-black, warm */
  --assistly-ink-soft: #3a322a;       /* secondary text */
  --assistly-ink-mute: #7a7166;       /* tertiary / meta */
  --assistly-hairline: rgba(26, 20, 15, 0.12);
  --assistly-hairline-strong: rgba(26, 20, 15, 0.22);

  /* --- Brass accent --------------------------------------- */
  --assistly-brass: #b8893a;
  --assistly-brass-soft: #d4ad6a;

  /* --- shadcn aliases consumed by button/input ------------- */
  --background: var(--assistly-paper);
  --foreground: var(--assistly-ink);
  --primary: var(--assistly-ink);
  --primary-foreground: #f5f1e8;
  --secondary: var(--assistly-paper-2);
  --secondary-foreground: var(--assistly-ink);
  --muted: var(--assistly-paper-2);
  --muted-foreground: var(--assistly-ink-mute);
  --accent: var(--assistly-brass-soft);
  --accent-foreground: var(--assistly-ink);
  --destructive: #8a2a2a;
  --border: var(--assistly-hairline-strong);
  --input: var(--assistly-hairline-strong);
  --ring: var(--assistly-brass);

  /* --- Component-specific aliases ------------------------- */
  --hairline: var(--assistly-hairline);
  --brass-2: var(--assistly-brass);
  --muted-2: var(--assistly-ink-mute);
  --assistly-primary: var(--assistly-ink);
}

/* --- Reset inside the widget ----------------------------- */
.assistly-root,
.assistly-root * {
  box-sizing: border-box;
}

.assistly-root {
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: var(--assistly-ink);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.assistly-font-display {
  font-family: 'Fraunces', 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-weight: 500;
  letter-spacing: -0.01em;
  font-feature-settings: "ss01", "ss02";
}

.assistly-font-mono {
  font-family: 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace;
  font-feature-settings: "ss01", "cv11";
}

/* --- Paper grain overlay --------------------------------- */
.assistly-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

/* --- Scrollbar ------------------------------------------- */
.assistly-scroll::-webkit-scrollbar {
  width: 6px;
}
.assistly-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.assistly-scroll::-webkit-scrollbar-thumb {
  background: var(--assistly-hairline-strong);
  border-radius: 999px;
}
.assistly-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--assistly-ink-mute);
}

/* --- Typing indicator ------------------------------------ */
.assistly-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--assistly-brass);
  animation: assistly-bounce 1.1s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.assistly-dot:nth-child(2) { animation-delay: 0.12s; background: var(--assistly-ink-soft); }
.assistly-dot:nth-child(3) { animation-delay: 0.24s; background: var(--assistly-brass-soft); }
.assistly-dot:nth-child(4) { animation-delay: 0.36s; background: var(--assistly-ink-mute); }

@keyframes assistly-bounce {
  0%, 60%, 100% { transform: translate3d(0, 0, 0); }
  30%           { transform: translate3d(0, -5px, 0); }
}

/* --- Bubble entrance ------------------------------------- */
.assistly-bubble-in {
  animation: assistly-spring 520ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
@keyframes assistly-spring {
  0%   { transform: scale(0.94) translate3d(0, 6px, 0); opacity: 0; }
  60%  { transform: scale(1.015) translate3d(0, -1px, 0); opacity: 1; }
  100% { transform: scale(1) translate3d(0, 0, 0); opacity: 1; }
}

/* --- Status pulse ---------------------------------------- */
.assistly-pulse {
  position: relative;
}
.assistly-pulse::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  background: #5a8c5a;
  opacity: 0.35;
  animation: assistly-pulse 2.4s ease-out infinite;
}
@keyframes assistly-pulse {
  0%   { transform: scale(0.6); opacity: 0.45; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* --- Send button hover ----------------------------------- */
.assistly-send {
  position: relative;
  background: var(--assistly-ink);
  color: var(--assistly-paper);
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
  box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 14px rgba(26,20,15,0.18);
}
.assistly-send:hover:not(:disabled) {
  background: var(--assistly-ink-soft);
  transform: translateY(-1px);
  box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 22px rgba(26,20,15,0.24);
}
.assistly-send:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 8px rgba(26,20,15,0.18);
}
.assistly-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* --- Markdown content ------------------------------------ */
.assistly-prose p {
  margin: 0 0 0.6em 0;
  white-space: pre-wrap;
}
.assistly-prose p:last-child { margin-bottom: 0; }
.assistly-prose ul, .assistly-prose ol {
  margin: 0.4em 0 0.6em 1.1em;
}
.assistly-prose li { margin-bottom: 0.25em; }
.assistly-prose code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.88em;
  padding: 0.1em 0.35em;
  background: rgba(26, 20, 15, 0.07);
  border-radius: 3px;
}
.assistly-prose a {
  color: var(--assistly-brass);
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 500;
}
.assistly-prose a:hover { color: var(--assistly-ink); }
.assistly-prose h1, .assistly-prose h2, .assistly-prose h3 {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  margin: 0.6em 0 0.3em 0;
  letter-spacing: -0.01em;
}
.assistly-prose h1 { font-size: 1.25em; }
.assistly-prose h2 { font-size: 1.1em; }
.assistly-prose h3 { font-size: 1em; }
.assistly-prose strong { font-weight: 600; }

/* --- Caret for streaming --------------------------------- */
.assistly-caret::after {
  content: '\u258D';
  display: inline-block;
  margin-left: 1px;
  color: var(--assistly-brass);
  animation: assistly-blink 1s steps(1) infinite;
}
@keyframes assistly-blink {
  50% { opacity: 0; }
}
`;

// src/lib/styles.ts
var styles_default2 = styles_default;

// src/widget.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
function AssistlyChat({
  chatbotId,
  origin,
  primaryColor,
  onReady,
  onError
}) {
  const client = useMemo(() => createApolloClient(origin), [origin]);
  const [mounted, setMounted] = useState3(false);
  useEffect3(() => {
    try {
      ensureAssistlyStyles(styles_default2);
      ensureAssistlyFonts();
      setMounted(true);
      onReady == null ? void 0 : onReady();
    } catch (err) {
      onError == null ? void 0 : onError(err);
    }
  }, [onReady, onError]);
  if (!mounted) return null;
  const themeVars = primaryColor ? {
    ["--assistly-brass"]: primaryColor,
    ["--assistly-primary"]: primaryColor
  } : {};
  return /* @__PURE__ */ jsx7(ApolloProvider, { client, children: /* @__PURE__ */ jsx7(
    "div",
    {
      className: "assistly-root",
      style: __spreadValues({
        width: "100%",
        height: "100%",
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "var(--assistly-paper)",
        color: "var(--assistly-ink)"
      }, themeVars),
      children: /* @__PURE__ */ jsx7(ChatbotClient_default, { id: String(chatbotId), chatbotName: "Assistant", origin })
    }
  ) });
}
export {
  AssistlyChat
};
//# sourceMappingURL=index.js.map