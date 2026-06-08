# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Assistly

An AI chatbot platform where admins (authenticated via Clerk) build and configure custom chatbots, and guests chat with those chatbots through an embeddable UI. The AI back-end is Hugging Face inference; data is stored in Postgres via a StepZen GraphQL gateway.

## Build & Run

```bash
pnpm install          # install deps (pnpm-lock.yaml present; repo also has package-lock.json)
pnpm dev              # next dev --turbopack
pnpm build            # next build
pnpm start            # next start
pnpm lint             # next lint
```

There is no test suite — `package.json` has no `test` script and no test runner is installed.

## Required Environment Variables

- `NEXT_PUBLIC_GRAPHQL_ENDPOINT` — StepZen GraphQL endpoint (e.g. `https://<account>.stepzen.net/api/killer-dragonfly/__graphql`)
- `GRAPHQL_TOKEN` — StepZen API key (sent as `Authorization: Apikey ...`)
- `HUGGINGFACE_API_KEY` — used by `app/api/send-message/route.ts`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — auth (consumed automatically by `@clerk/nextjs`)

## High-Level Architecture

### Two route groups
`app/(admin)` is the dashboard (requires a signed-in Clerk user — see `proxy.ts` and the layout-level `auth()` check in `app/(admin)/layout.tsx`). `app/(guest)` is unauthenticated and hosts the public `/login` and `/chatbot/[id]` pages. The `/chatbot/[id]` page is what gets embedded as an iframe on customer sites — `next.config.ts` sets `frame-ancestors *` and `X-Frame-Options: ALLOWALL` only for that path so the chatbot can be cross-origin embedded.

### Auth
- `proxy.ts` (Next.js 16 replaces `middleware.ts` — note the file is at the project root, not under `app/`) uses `clerkMiddleware`. Public routes: `/chatbot/*`, `/api/send-message`, `/api/graphql`, `/login`. The admin layout additionally redirects unauthenticated users to `/login`.
- The admin layout gets `userId` via `auth()` server-side; client pages read the user with `useUser()`.

### GraphQL layer (StepZen → Postgres)
- `stepzen/postgresql/index.graphql` defines the SDL that StepZen auto-generates from the Postgres schema (`chatbots`, `chatbot_characteristics`, `guests`, `chat_sessions`, `messages`).
- `stepzen/config.yaml` points StepZen at the Neon Postgres pooler (the connection string is committed; treat this as a leak in any real deployment).
- `app/api/graphql/route.ts` is a thin proxy: it accepts `{ query, variables }` and forwards to StepZen. CORS is wide open so the browser can call it cross-origin from embedded iframes.
- The browser-side Apollo client (`qraphql/apolloClient.ts`) talks to `/api/graphql`; the server-side Apollo client (`lib/server/serverClient.ts`, `ssrMode: true`) talks directly to StepZen with the `Apikey` header. Both share `no-cache` + `errorPolicy: 'all'` defaults.
- The folder is named `qraphql/` (typo) — that's the import alias used throughout the codebase. Renaming it would require updating every import.

### Data model
Types live in `types/types.ts`. The core entities: `Chatbot` → has many `ChatbotCharacteristic` and `ChatSession`; `ChatSession` → has one `Guest` and many `Message`; `Message.sender` is `"ai" | "user"`. Admins are linked to chatbots by `clerk_user_id`. There is no DB-level uniqueness or row-level filtering enforced from the API — admin pages do client-side `chatbot.clerk_user_id === userId` filtering (`app/(admin)/view-chatbots/page.tsx`).

### Chat flow
1. Guest opens `/chatbot/[id]`, a Radix dialog asks for name + email.
2. `lib/startNewChat.ts` runs three Apollo mutations in sequence: insert a `Guest`, insert a `ChatSession` linking the guest to the chatbot, and insert a welcome `Message` from `"ai"`.
3. Messages are sent to `POST /api/send-message` (`app/api/send-message/route.ts`). That route:
   - Fetches the chatbot's `chatbot_characteristics` and prior `messages` from the session.
   - Builds a system prompt: `"You are SMOEDESIGN professional front desk assistant talking to $ {name}. ... characteristics..."` (the literal `$` is a bug — see pitfalls).
   - Calls Hugging Face `chatCompletion` with model `meta-llama/Llama-3.1-8B-Instruct`, provider `sambanova`, `max_tokens: 512`, `temperature: 0.7`.
   - Persists the user message then the AI response via the `InsertMessage` mutation.
4. The client (`app/(guest)/chatbot/[id]/page.tsx`) renders messages optimistically with a "Thinking..." placeholder that gets swapped for the real response. Markdown is rendered with `react-markdown` + `remark-gfm` (`components/ui/Messages.tsx`).

### UI components
- `components/ui/*` holds shadcn-style primitives (Radix UI + Tailwind) plus app-specific components like `Header`, `Sidebar`, `Avatar` (Dicebear-based), `Messages`, and `ChatbotSessions`.
- `app/globals.css` declares the full shadcn `oklch` theme token set plus `daisyui` and `tailwindcss-animate` plugins. The actual styling uses Tailwind utility classes — `daisyui` is registered as a plugin but `chat-bubble` classes in `Messages.tsx` rely on it.

### Deploy
`vercel.json` adds CORS headers under `/api/(.*)` (largely redundant with `next.config.ts`). The `next.config.ts` headers block is the source of truth for the iframe-embeddable chatbot and API CORS.

## Important Pitfalls

- **System prompt bug** in `app/api/send-message/route.ts`: the literal `SMOEDESIGN` brand is hard-coded, and `talking to $ ${name}` includes a stray `$`. Both should be parameterized or fixed.
- **StepZen connection string is committed** in `stepzen/config.yaml`. The Neon password is in version control.
- **Folder typo**: `qraphql/` (missing `a`). Don't "fix" the spelling without updating all imports and the tsconfig path (which uses `@/*`, so folder renames are safe — but the name is referenced in code review and habit).
- **`proxy.ts` is the new middleware file** for Next.js 16; the old `middleware.ts` is deleted. If you add cross-cutting request logic, edit `proxy.ts`, not `app/`.
- **No DB-level tenant isolation**: admin pages filter by `clerk_user_id` client-side after fetching the full list. Any new admin query that touches chatbots should follow the same pattern, or add proper server-side filtering at the GraphQL layer.
- **Wide-open CORS** on `/api/*` and `/chatbot/*` is intentional for iframe embedding. Don't tighten it without a plan to handle cross-origin embeds.
- **No test suite**. Verify changes manually by running `pnpm dev` and exercising the admin and guest flows, or by hitting the API routes with curl.
- **Hugging Face model and provider are hard-coded** in `send-message/route.ts`. Switching models or providers requires editing that file.
- **Apollo `no-cache`** is set globally — queries that need caching would have to opt out per-call.
