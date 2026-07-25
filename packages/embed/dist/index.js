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
import { useEffect as useEffect2, useState as useState2 } from "react";
import { useQuery } from "@apollo/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

// src/ui/Avatar.tsx
import { rings } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { jsx } from "react/jsx-runtime";
function utf8ToBase64(input) {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function Avatar({ seed, className }) {
  const avatar = createAvatar(rings, { seed });
  const svg = avatar.toString();
  const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(svg)}`;
  return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: dataUrl, alt: "Avatar", width: 80, height: 80, className }) });
}
var Avatar_default = Avatar;

// src/ui/Messages.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// src/ui/ChatMotion.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function FourDotWave({ className = "" }) {
  const dots = [
    { color: "#8a2a2a", delay: "0s" },
    // oxblood
    { color: "#c89a5b", delay: "0.12s" },
    // brass
    { color: "#5a6b3b", delay: "0.24s" },
    // moss
    { color: "#2c5b5e", delay: "0.36s" }
    // teal
  ];
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 ${className}`, "aria-label": "Loading", children: [
    dots.map((d, i) => /* @__PURE__ */ jsx2(
      "span",
      {
        className: "dot-wave",
        style: { backgroundColor: d.color, animationDelay: d.delay }
      },
      i
    )),
    /* @__PURE__ */ jsx2("style", { children: `
        .dot-wave {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          will-change: transform;
          animation: dotBounce 1.1s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translate3d(0, 0, 0); }
          30%           { transform: translate3d(0, -6px, 0); }
        }
      ` })
  ] });
}
function AiBubble({
  children,
  className = "",
  springIn = true,
  style,
  typing = false
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `ai-bubble ${springIn ? "ai-bubble-in" : ""} ${typing ? "ai-typing" : ""} ${className}`,
      style,
      children: [
        children,
        /* @__PURE__ */ jsx2("style", { children: `
        .ai-bubble {
          position: relative;
          transform-origin: bottom left;
          color: #1e1e1e;
          background: linear-gradient(
            135deg,
            #eef2ff 0%,
            #f5f3ff 35%,
            #ecfeff 70%,
            #eef2ff 100%
          );
          background-size: 250% 250%;
          will-change: transform, background-position, box-shadow;
          transition: box-shadow 220ms ease, background 220ms ease;
        }
        .ai-bubble-in {
          animation: aiSpring 620ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        /* Typing state: vibrant purple gradient with glow */
        .ai-typing {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 35%, #8b5cf6 70%, #7c3aed 100%);
          background-size: 200% 200%;
          animation: aiTypingShift 4.5s ease-in-out infinite;
          box-shadow: 0 12px 36px rgba(124,58,237,0.20), 0 1px 0 rgba(255,255,255,0.05) inset;
          color: #fff;
          border-color: rgba(255,255,255,0.08);
        }
        @keyframes aiSpring {
          0%   { transform: scale(0.4) translate3d(0, 12px, 0); opacity: 0; }
          60%  { transform: scale(1.04) translate3d(0, -2px, 0); opacity: 1; }
          100% { transform: scale(1) translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes aiTypingShift {
          0%   { background-position:   0%  50%; filter: drop-shadow(0 0 0 rgba(124,58,237,0)); }
          50%  { background-position: 100%  50%; filter: drop-shadow(0 18px 48px rgba(124,58,237,0.18)); }
          100% { background-position:   0%  50%; filter: drop-shadow(0 0 0 rgba(124,58,237,0)); }
        }
      ` })
      ]
    }
  );
}
function UserBubble({
  children,
  className = "",
  springIn = true,
  style
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `user-bubble ${springIn ? "user-bubble-in" : ""} ${className}`,
      style,
      children: [
        children,
        /* @__PURE__ */ jsx2("style", { children: `
        .user-bubble {
          position: relative;
          transform-origin: bottom right;
          background: #111113;
          color: #ffffff;
          will-change: transform;
        }
        .user-bubble-in {
          animation: userSpring 520ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        @keyframes userSpring {
          0%   { transform: scale(0.4) translate3d(0, 12px, 0); opacity: 0; }
          60%  { transform: scale(1.04) translate3d(0, -2px, 0); opacity: 1; }
          100% { transform: scale(1) translate3d(0, 0, 0); opacity: 1; }
        }
      ` })
      ]
    }
  );
}

// src/ui/Messages.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}
function TypewriterMarkdown({ text, isFresh, components, onType }) {
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
      }, 15);
      return () => clearTimeout(timeout);
    } else if (!isFresh) {
      setDisplayedText(text || "");
    }
  }, [index, text, isFresh]);
  return /* @__PURE__ */ jsx3(
    ReactMarkdown,
    {
      remarkPlugins: [remarkGfm],
      components,
      children: isFresh ? displayedText : text
    }
  );
}
function Messages({ messages, chatbotName, logoUrl, isReviewPage = false }) {
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
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  const markdownComponents = {
    ul: (_a) => {
      var _b = _a, { node } = _b, props = __objRest(_b, ["node"]);
      return /* @__PURE__ */ jsx3("ul", __spreadValues({ className: "list-disc list-inside ml-5 mb-3" }, props));
    },
    ol: (_c) => {
      var _d = _c, { node } = _d, props = __objRest(_d, ["node"]);
      return /* @__PURE__ */ jsx3("ol", __spreadValues({ className: "list-decimal list-inside ml-5 mb-3" }, props));
    },
    h1: (_e) => {
      var _f = _e, { node } = _f, props = __objRest(_f, ["node"]);
      return /* @__PURE__ */ jsx3("h1", __spreadValues({ className: "text-2xl font-bold mb-3 font-display" }, props));
    },
    h2: (_g) => {
      var _h = _g, { node } = _h, props = __objRest(_h, ["node"]);
      return /* @__PURE__ */ jsx3("h2", __spreadValues({ className: "text-xl font-bold mb-3 font-display" }, props));
    },
    h3: (_i) => {
      var _j = _i, { node } = _j, props = __objRest(_j, ["node"]);
      return /* @__PURE__ */ jsx3("h3", __spreadValues({ className: "text-lg font-bold mb-3 font-display" }, props));
    },
    table: (_k) => {
      var _l = _k, { node } = _l, props = __objRest(_l, ["node"]);
      return /* @__PURE__ */ jsx3("table", __spreadValues({ className: "table-auto mb-3 w-full border-separate border-2 rounded-sm border-spacing-4", style: { borderColor: "rgba(26,20,15,0.18)" } }, props));
    },
    th: (_m) => {
      var _n = _m, { node } = _n, props = __objRest(_n, ["node"]);
      return /* @__PURE__ */ jsx3("th", __spreadValues({ className: "text-left underline" }, props));
    },
    p: (_o) => {
      var _p = _o, { node } = _p, props = __objRest(_p, ["node"]);
      return /* @__PURE__ */ jsx3("p", __spreadValues({ className: "whitespace-pre-wrap mb-3 last:mb-0 leading-relaxed" }, props));
    },
    a: (_q) => {
      var _r = _q, { node } = _r, props = __objRest(_r, ["node"]);
      return /* @__PURE__ */ jsx3("a", __spreadValues({ className: "hover:underline font-semibold", style: { color: "#c45d4f" }, rel: "noopener noreferrer", target: "_blank" }, props));
    },
    code: (_s) => {
      var _t = _s, { node } = _t, props = __objRest(_t, ["node"]);
      return /* @__PURE__ */ jsx3(
        "code",
        __spreadValues({
          className: "px-1.5 py-0.5 rounded font-mono text-[13px]",
          style: { background: "rgba(26,20,15,0.10)" }
        }, props)
      );
    }
  };
  return /* @__PURE__ */ jsxs2("div", { className: "flex flex-1 flex-col space-y-7 py-8 px-5 md:px-10 bg-transparent rounded-lg scroll-smooth ", children: [
    messages.map((message, index) => {
      const isSender = message.sender !== "user";
      const isThinking = message.content === "" || message.content === "Thinking...";
      const isFresh = index === messages.length - 1;
      const showMeta = hoveredId === message.id || isReviewPage;
      return /* @__PURE__ */ jsxs2(
        "div",
        {
          onMouseEnter: () => setHoveredId(message.id),
          onMouseLeave: () => setHoveredId(null),
          className: `chat ${isSender ? "chat-start" : "chat-end"} relative group overflow-hidden`,
          children: [
            isReviewPage && /* @__PURE__ */ jsxs2("p", { className: "absolute -bottom-5 text-xs text-gray-300", children: [
              "sent ",
              new Date(message.created_at).toLocaleString()
            ] }),
            isFresh && /* @__PURE__ */ jsx3(
              "span",
              {
                "aria-hidden": true,
                className: "ring-out pointer-events-none absolute -inset-2 rounded-[26px]"
              }
            ),
            /* @__PURE__ */ jsx3("div", { className: `chat-image avatar w-10 ${!isSender && "mr-4"}`, children: logoUrl ? /* @__PURE__ */ jsx3(
              "img",
              {
                src: logoUrl,
                alt: chatbotName || "Chatbot logo",
                width: 48,
                height: 48,
                className: "h-12 w-12 rounded-full border object-cover",
                style: { borderColor: "var(--hairline)" }
              }
            ) : isSender ? /* @__PURE__ */ jsx3(
              "div",
              {
                className: "border h-12 w-12 rounded-full bg-white overflow-hidden",
                style: { borderColor: "var(--hairline)" },
                children: /* @__PURE__ */ jsx3(Avatar_default, { seed: chatbotName, className: "h-12 w-12" })
              }
            ) : /* @__PURE__ */ jsx3("div", { className: "h-12 w-12 rounded-full grid place-items-center", style: { background: "rgba(244,234,215,0.06)" }, children: /* @__PURE__ */ jsx3(UserCircle, { className: "text-[var(--brass-2)]" }) }) }),
            isSender ? /* @__PURE__ */ jsx3(
              AiBubble,
              {
                springIn: isFresh,
                typing: isThinking,
                className: "chat-bubble relative rounded-2xl px-4 py-3 max-w-[80%] font-body text-[15px] leading-relaxed",
                style: isThinking ? {} : { border: "1px solid rgba(224,176,112,0.18)" },
                children: isThinking ? /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3 py-1", style: { color: "#1e1e1e" }, children: [
                  /* @__PURE__ */ jsx3(FourDotWave, {}),
                  /* @__PURE__ */ jsx3("span", { className: "font-mono text-[10px] uppercase tracking-[0.25em] opacity-70", children: "Thinking..." })
                ] }) : /* @__PURE__ */ jsx3(
                  TypewriterMarkdown,
                  {
                    text: message.content,
                    isFresh,
                    components: markdownComponents,
                    onType: () => scrollToBottom(false)
                  }
                )
              }
            ) : /* @__PURE__ */ jsx3(
              UserBubble,
              {
                springIn: isFresh,
                className: "chat-bubble relative rounded-2xl px-4 py-3 max-w-[80%] font-body text-[15px] leading-relaxed",
                style: {
                  background: "#e9e3e3ff",
                  color: "#1e1e1e",
                  border: "1px solid rgba(231, 228, 224, 0.22)"
                },
                children: /* @__PURE__ */ jsx3(
                  ReactMarkdown,
                  {
                    remarkPlugins: [remarkGfm],
                    components: markdownComponents,
                    children: message.content
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs2(
              "div",
              {
                className: `mt-1.5 px-1  flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-opacity duration-200 ${showMeta ? "opacity-100" : "opacity-0"}`,
                style: { color: "var(--muted-2)" },
                children: [
                  /* @__PURE__ */ jsx3("span", { children: isSender ? chatbotName || "assistant" : "you" }),
                  /* @__PURE__ */ jsx3("span", { className: "w-1 h-1 rounded-full", style: { background: "var(--muted-2)" } }),
                  /* @__PURE__ */ jsx3("span", { children: formatTime(message.created_at) })
                ]
              }
            )
          ]
        },
        message.id || index
      );
    }),
    /* @__PURE__ */ jsx3("div", { ref })
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
import { jsx as jsx4 } from "react/jsx-runtime";

// src/ui/form.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
var Form = FormProvider;
var FormFieldContext = React2.createContext(
  {}
);
var FormField = (_a) => {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx5(FormFieldContext.Provider, { value: { name: props.name }, children: /* @__PURE__ */ jsx5(Controller, __spreadValues({}, props)) });
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
  return /* @__PURE__ */ jsx5(FormItemContext.Provider, { value: { id }, children: /* @__PURE__ */ jsx5(
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
  return /* @__PURE__ */ jsx5(
    Slot,
    __spreadValues({
      "data-slot": "form-control",
      id: formItemId,
      "aria-describedby": !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`,
      "aria-invalid": !!error
    }, props)
  );
}

// src/ui/input.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function Input(_a) {
  var _b = _a, { className, type } = _b, props = __objRest(_b, ["className", "type"]);
  return /* @__PURE__ */ jsx6(
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
import { jsx as jsx7 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx7(
    Comp,
    __spreadValues({
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className }))
    }, props)
  );
}

// src/ChatbotClient.tsx
import { jsx as jsx8, jsxs as jsxs3 } from "react/jsx-runtime";
var formSchema = z.object({
  message: z.string().min(3, "Your Message is too short!")
});
function ChatbotClient({ id, chatbotName, origin }) {
  const [name, setName] = useState2("");
  const [email, setEmail] = useState2("");
  const [onboardingStep, setOnboardingStep] = useState2(1);
  const [chatId, setChatId] = useState2(0);
  const [loading, setLoading] = useState2(false);
  const [message, setMessage] = useState2([
    {
      id: -1,
      content: `Hi there! I'm ${chatbotName}. I'd love to help you out, but first, could you tell me your name?`,
      sender: "ai",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      chat_session_id: 0
    }
  ]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: ""
    }
  });
  const { data } = useQuery(
    GET_MESSEGES_BY_CHAT_SESSION_ID,
    {
      variables: { chat_session_id: chatId },
      skip: !chatId
    }
  );
  useEffect2(() => {
    if (data && onboardingStep === 3) {
      const chatSession = data.chat_sessions;
      const dbMessages = chatSession.messages || [];
      setMessage((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = dbMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
    }
  }, [data, onboardingStep]);
  async function onsubmit(values) {
    const { message: formMessage } = values;
    form.reset();
    if (onboardingStep === 1) {
      if (!formMessage.trim()) return;
      const userMsg = {
        id: Date.now(),
        content: formMessage,
        chat_session_id: 0,
        sender: "user",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const aiMsg = {
        id: Date.now() + 1,
        content: `It's a pleasure to meet you, ${formMessage}! Just one more thing\u2014what's your email address so we can stay connected?`,
        chat_session_id: 0,
        sender: "ai",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      setName(formMessage);
      setOnboardingStep(2);
      setMessage((prev) => [...prev, userMsg, aiMsg]);
      return;
    }
    if (onboardingStep === 2) {
      if (!formMessage.trim()) return;
      const isValidEmail = (email2) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email2);
      };
      if (!isValidEmail(formMessage.trim())) {
        setMessage((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            content: "Please enter a valid email address so we can continue.",
            chat_session_id: 0,
            sender: "ai",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        ]);
        return;
      }
      const userMsg = {
        id: Date.now(),
        content: formMessage,
        chat_session_id: 0,
        sender: "user",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      setMessage((prev) => [...prev, userMsg]);
      setLoading(true);
      try {
        const finalEmail = formMessage;
        setEmail(finalEmail);
        const newChatId = await startNewChat_default(origin, name, finalEmail, Number(id));
        setChatId(newChatId);
        setOnboardingStep(3);
      } catch (error) {
        console.error("Error starting chat:", error);
        setMessage((prev) => [...prev, {
          id: Date.now() + 1,
          content: "Sorry, I had trouble setting up your session. Could you please try entering your email again?",
          chat_session_id: 0,
          sender: "ai",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }
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
  return /* @__PURE__ */ jsx8("div", { className: "fixed inset-0 flex flex-col bg-gray-50 text-slate-900 md:p-6 md:pb-0", children: /* @__PURE__ */ jsxs3("div", { className: "flex flex-col w-full max-w-3xl mx-auto flex-1 overflow-hidden md:rounded-t-2xl border border-gray-200 bg-white relative", children: [
    /* @__PURE__ */ jsxs3("div", { className: "border-b border-gray-100 bg-white py-3 px-4 md:py-6 md:px-8 flex items-center justify-between shrink-0", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center space-x-3 md:space-x-4 min-w-0", children: [
        /* @__PURE__ */ jsxs3("div", { className: "relative shrink-0", children: [
          /* @__PURE__ */ jsx8(
            Avatar_default,
            {
              seed: chatbotName != null ? chatbotName : "default-seed",
              className: "w-9 h-9 md:w-10 md:h-10 bg-gray-100 rounded-full border border-gray-200"
            }
          ),
          /* @__PURE__ */ jsx8("div", { className: "absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" })
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx8("h1", { className: "truncate text-sm md:text-base font-semibold text-slate-900", children: chatbotName || "Assistant" }),
          /* @__PURE__ */ jsxs3("p", { className: "text-xs text-slate-400 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx8("span", { className: "w-2 h-2 bg-emerald-500 rounded-full" }),
            "Online"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx8("div", { className: "hidden sm:block text-[11px] font-medium text-slate-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100", children: "Secure Session" })
    ] }),
    /* @__PURE__ */ jsx8("div", { className: "flex-1 relative bg-white pb-32 md:pb-36 overflow-y-auto", children: /* @__PURE__ */ jsx8(Messages_default, { messages: message, chatbotName: chatbotName || "" }) }),
    /* @__PURE__ */ jsx8("div", { className: "absolute bottom-0 w-full bg-white p-3 md:p-6 border-t border-gray-100", children: /* @__PURE__ */ jsx8(Form, __spreadProps(__spreadValues({}, form), { children: /* @__PURE__ */ jsxs3(
      "form",
      {
        className: "relative flex items-center gap-2 md:gap-3 max-w-4xl mx-auto",
        onSubmit: form.handleSubmit(onsubmit),
        children: [
          /* @__PURE__ */ jsx8("div", { className: "relative flex-1", children: /* @__PURE__ */ jsx8(
            FormField,
            {
              control: form.control,
              name: "message",
              render: ({ field }) => /* @__PURE__ */ jsx8(FormItem, { className: "flex-1", children: /* @__PURE__ */ jsx8(FormControl, { children: /* @__PURE__ */ jsx8(
                Input,
                __spreadProps(__spreadValues({}, field), {
                  placeholder: onboardingStep === 1 ? "Your name..." : onboardingStep === 2 ? "Your email..." : "Type a message...",
                  className: "p-3 md:p-5 rounded-xl bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all"
                })
              ) }) })
            }
          ) }),
          /* @__PURE__ */ jsx8(
            Button,
            {
              type: "submit",
              disabled: form.formState.isSubmitting || !form.formState.isValid || loading,
              className: "h-12 w-12 md:h-16 md:w-16 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shrink-0",
              children: loading ? /* @__PURE__ */ jsx8("div", { className: "h-6 w-6 md:h-8 md:w-8 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsx8("p", { className: "cursor-pointer text-sm md:text-base", children: "Send" })
            }
          )
        ]
      }
    ) })) })
  ] }) });
}
var ChatbotClient_default = ChatbotClient;

// src/widget.tsx
import { jsx as jsx9 } from "react/jsx-runtime";
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
    setMounted(true);
    onReady == null ? void 0 : onReady();
    try {
    } catch (err) {
      onError == null ? void 0 : onError(err);
    }
  }, [onReady, onError]);
  if (!mounted) return null;
  return /* @__PURE__ */ jsx9(ApolloProvider, { client, children: /* @__PURE__ */ jsx9(
    "div",
    {
      style: __spreadValues({
        width: "100%",
        height: "100%",
        minHeight: 400,
        display: "flex",
        flexDirection: "column"
      }, primaryColor ? { "--assistly-primary": primaryColor } : null),
      children: /* @__PURE__ */ jsx9(ChatbotClient_default, { id: String(chatbotId), chatbotName: "Assistant", origin })
    }
  ) });
}
export {
  AssistlyChat
};
//# sourceMappingURL=index.js.map