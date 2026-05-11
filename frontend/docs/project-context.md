# DevNexus Frontend — Project Context & Coding Guidelines

> **This document is the single source of truth for all AI coding agents working on this frontend.**
> Read it in full before writing any code. Violating these rules is unacceptable.

---

## 1. PROJECT OVERVIEW & TECH STACK

### Core Framework

| Item | Value |
|---|---|
| **Next.js** | `16.1.6` — **App Router** (NOT Pages Router) |
| **React** | `19.2.3` |
| **TypeScript** | `^5` — strict mode enforced |
| **Node Runtime** | Standalone output (`next.config.ts → output: "standalone"`) |

### Routing Paradigm

- **App Router** with route groups: `(main)`, `(auth)`, `(admin)`, `(marketing)`.
- Proxy middleware in `src/proxy.ts` (Next.js 16 `proxy()` export) handles authentication gating and RBAC.
- Route protection is defined declaratively via `routeRules` array with regex path matchers and required roles.

### Key Libraries

| Concern | Library | Notes |
|---|---|---|
| **Server State** | `@tanstack/react-query ^5.90` | Primary data-fetching layer. All GET/POST queries go through TanStack Query hooks. |
| **Client State** | `@reduxjs/toolkit ^2.11` + `react-redux ^9.2` | **Auth state only** (`auth-slice`). Do NOT use Redux for server data. |
| **Styling** | `Tailwind CSS v4` + `shadcn/ui` (Radix primitives) | Utility-first. Custom design tokens in `globals.css`. `cn()` helper merges classes. |
| **Form Handling** | `react-hook-form ^7.71` | All forms use `useForm` + `Controller` with inline validation rules (`required`, `minLength`, etc.). Do NOT use Zod, Yup, or external schema resolvers.
| **HTTP Client** | `axios ^1.13` (client-side), native `fetch` (server-side) | Two separate API layers — see Section 2. |
| **Auth Tokens** | `js-cookie` (client read/write), `jose` (server-side JWT verification), `jwt-decode` (client-side decode) | |
| **Toasts** | `sonner ^2.0` | All user-facing success/error notifications use `toast()` from Sonner. |
| **Icons** | `lucide-react` | The ONLY icon library. Do NOT introduce other icon packages. |
| **Theming** | `next-themes` | Dark/light mode via `ThemeProvider`. |
| **Markdown** | `@uiw/react-md-editor` + `rehype-sanitize` | For content editing and viewing. |

---

## 2. BACKEND INTEGRATION RULES (ASP.NET Core)

### 2.1 Universal API Response Contract

The ASP.NET Core backend wraps **every** response in a `ReturnResult<T>` envelope:

```typescript
// src/types/common/return-result.ts
export interface ReturnResult<T> {
    message: string;  // null on success, error string on failure
    result: T;        // payload on success, null on failure
}
```

**RULE:** Every API call MUST type its response as `ReturnResult<T>`. The frontend unwraps `.result` in the service layer. Components NEVER see `ReturnResult` — they receive the inner `T` directly.

### 2.2 Two API Layers — NEVER Mix Them

#### Client-Side: Axios Instance (`src/lib/axiosConfig.ts`)

- Used by all files in `src/services/*.ts` and by client components.
- Base URL: `process.env.NEXT_PUBLIC_API_URL_HTTPS || NEXT_PUBLIC_API_URL_HTTP` (includes `/api` suffix).
- Sends `withCredentials: true`.
- **Request interceptor** attaches `Bearer {accessToken}` from `js-cookie`.
- **Response interceptor** handles:
  - Business errors (HTTP 200 with `message !== null`) → `toast.error()`.
  - 401 → automatic refresh token flow with queue management.
  - Refresh failure → clears cookies + Redux → redirects to `/login`.

#### Server-Side: Fetch Wrapper (`src/lib/server-api.ts`)

- Used **exclusively** in Server Components / `page.tsx` files for SSR prefetching.
- Uses native `fetch` with `cache: 'no-store'`.
- Reads `accessToken` from `next/headers` cookies (NOT `js-cookie`).
- Returns `Promise<T>` (unwrapped result) — throws on business error or null result.
- **MUST NOT** import `axiosConfig`, `js-cookie`, `redux store`, or any client module.

```
┌─────────────────────┐     ┌──────────────────────────┐
│   Server Component   │     │    Client Component       │
│   (page.tsx SSR)     │     │    ('use client')         │
│                      │     │                           │
│   serverPost<T>()    │     │   service.method()        │
│   (fetch + cookies)  │     │   (axios + js-cookie)     │
└──────────┬───────────┘     └──────────┬────────────────┘
           │                            │
           └────────── ASP.NET ─────────┘
                    /api/Resource
```

### 2.3 Base URL & Environment

```env
NEXT_PUBLIC_API_URL_HTTP=http://localhost:5105/api    # Dev — includes /api suffix
# NEXT_PUBLIC_API_URL_HTTPS=https://localhost:7184/api  # HTTPS dev (optional)
JWT_SECRET=...                                         # Server-only, for proxy.ts verification
INTERNAL_PLATFORM_CORE_SERVICE_API_URL=http://localhost:5105  # For next.config.ts rewrites
```

**RULE:** Service paths are relative to the base URL which already contains `/api`. Write paths as `/Posts/paging`, NOT `/api/Posts/paging`.

### 2.4 Backend Endpoint Conventions

The backend follows these CRUD conventions per controller:

| Action | HTTP Method | Path Pattern | Return Type |
|---|---|---|---|
| Create | `POST` | `/Resource` | `ReturnResult<ResourceDTO>` |
| Get by ID | `GET` | `/Resource/{id}` | `ReturnResult<ResourceDTO>` |
| Paginated list | `POST` | `/Resource/paging` | `ReturnResult<PagedData<ResourceDTO, string>>` |
| Update | `PUT` | `/Resource` | `ReturnResult<ResourceDTO>` |
| Delete one | `DELETE` | `/Resource/{id}` | `ReturnResult<bool>` |
| Delete many | `DELETE` | `/Resource` (body: `Page<string>`) | `ReturnResult<int>` |

> **CAUTION: Do NOT invent backend endpoints.** Only use endpoints that are already defined in `src/services/*.ts` files or explicitly confirmed from backend context. If an endpoint does not exist in the services layer, ASK before assuming it exists.

### 2.5 Known Endpoints Registry

**Accounts** (`/Accounts`): `login`, `register`, `refresh-token`, `logout`, `change-password`, `request-reset-password`, `reset-password`, `request-confirm-email`, `confirm-email`, `google-login`, `github-login`

**Posts** (`/Posts`): CRUD + `/paging` (POST)

**QAPosts** (`/QAPosts`): CRUD + `/paging` (POST)

**Comments** (`/Comments`): CRUD + `/my-comments` (POST), `/by-post/{postId}` (POST), `/by-answer/{answerId}` (POST), `/{commentId}/replies` (POST)

**Answers** (`/Answers`): CRUD + `/{postId}/paging` (POST), `/{answerId}/accept` (PUT)

**Votes** (`/Votes`): `/post/{postId}` (POST), `/answer/{answerId}` (POST), `/comment/{commentId}` (POST)

**Profiles** (`/Profiles`): `GET /{profileId}`, `PUT /` (update)

### 2.6 Authentication & Authorization Flow

1. **Login:** Client calls `accountService.login()` → receives `TokenResponseDTO { accessToken, refreshToken }`.
2. **Storage:** Tokens stored in `js-cookie` with `Secure` flag only on HTTPS, `sameSite: 'strict'`, `expires: 15` days.
3. **Redux sync:** `parseUserFromToken()` decodes JWT claims → dispatches `setToken()` to Redux `auth` slice.
4. **Request auth:** Axios request interceptor reads `accessToken` cookie → sets `Authorization: Bearer {token}`.
5. **Refresh flow:** On 401, interceptor queues concurrent requests, calls `/Accounts/refresh-token` with raw `axios` (not the interceptor instance), updates cookies + Redux, replays queued requests.
6. **Server-side auth:** `proxy.ts` uses `jose.jwtVerify()` for cryptographic verification. `server-api.ts` reads cookies via `next/headers`.
7. **Logout:** Clears cookies + dispatches `clearToken()` → redirect to `/login`.

---

## 3. STATE MANAGEMENT & DATA FLOW

### 3.1 Global vs. Local State

| State Type | Tool | Example |
|---|---|---|
| **Auth identity** (current user, tokens) | Redux Toolkit (`auth-slice`) | `useSelector((state: RootState) => state.auth)` |
| **Server/remote data** (posts, comments, votes) | TanStack Query | `useQuery`, `useMutation`, `useInfiniteQuery` |
| **Form state** | React Hook Form | `useForm<PostFormData>()` |
| **UI-local state** (toggles, modals) | React `useState` | Component-scoped only |

**RULE:** NEVER put server data in Redux. All fetched data lives in the TanStack Query cache.

### 3.2 DTO Mapping Convention

Backend C# DTOs map 1:1 to TypeScript interfaces located in `src/types/{domain}/`:

| Backend DTO | Frontend Interface | File Path |
|---|---|---|
| `CreatePostDTO` | `CreatePostDTO` | `types/post/create-post-dto.ts` |
| `SelectPostDTO` | `SelectPostDTO` | `types/post/select-post-dto.ts` |
| `UpdatePostDTO` | `UpdatePostDTO` | `types/post/update-post-dto.ts` |

**Naming convention:**
- `Create{Resource}DTO` — request body for POST create
- `Select{Resource}DTO` — response shape for GET / query results
- `Update{Resource}DTO` — request body for PUT update

**RULE:** Property names MUST match the backend's camelCase serialization exactly. Do not rename, alias, or transform properties.

### 3.3 Query Key Factory Pattern

Every domain has a query key factory in `src/hooks/{domain}-hooks/use-{domain}-query-keys.ts`:

```typescript
// src/hooks/post-hooks/use-post-query-keys.ts
export const postQueryKeys = {
    all: ['posts'] as const,
    lists: () => [...postQueryKeys.all, 'list'] as const,
    list: (filters: unknown) => [...postQueryKeys.lists(), { filters }] as const,
    details: () => [...postQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...postQueryKeys.details(), id] as const,
};
```

**RULE:** Always use the query key factory. NEVER construct raw string arrays like `['posts', id]` inline.

### 3.4 Concrete Example: GET with Infinite Scroll

**Layer 1 — Service** (`src/services/post-service.ts`):
```typescript
getPostsWithPagination: async (payload: Page<string>): Promise<PagedData<SelectPostDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SelectPostDTO, string>>>('/Posts/paging', payload);
    return data.result;  // unwrap here
},
```

**Layer 2 — Hook** (`src/hooks/post-hooks/use-get-posts-infinite.ts`):
```typescript
export function useGetPostsInfinite(basePayload: InfiniteBasePayload, staleTime?: number) {
    return useInfiniteQuery({
        queryKey: postQueryKeys.list({ ...basePayload, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            postService.getPostsWithPagination({
                ...basePayload, size: INFINITE_PAGE_SIZE, pageNumber: pageParam as number,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => { /* pagination logic */ },
        staleTime,
    });
}
```

**Layer 3 — Container** (`src/components/post/infinite-post-list.tsx`):
```typescript
'use client';
export function InfinitePostList() {
    const { data, isLoading, ... } = useGetPostsInfinite(FEED_BASE_PAYLOAD, STALE_TIME);
    const posts = useMemo(() => data?.pages.flatMap((page) => page?.data ?? []), [data]);
    return <PostListView posts={posts} ... />;
}
```

**Layer 4 — SSR Page** (`src/app/(main)/feed/page.tsx`):
```typescript
// Server Component — prefetches data, passes to client via HydrationBoundary
export default async function FeedPage() {
    const queryClient = getQueryClient();
    await queryClient.prefetchInfiniteQuery({ /* same queryKey + serverPost */ });
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <InfinitePostList />
        </HydrationBoundary>
    );
}
```

### 3.5 Concrete Example: POST Mutation (Create)

**Service:**
```typescript
createPost: async (dto: CreatePostDTO): Promise<SelectPostDTO> => {
    const { data } = await api.post<ReturnResult<SelectPostDTO>>('/Posts', dto);
    return data.result;
},
```

**Hook:**
```typescript
export const useCreatePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreatePostDTO) => postService.createPost(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                toast.success("Post created successfully!");
            }
        }
    });
};
```

**Component:**
```typescript
const { mutate: createPost, isPending } = useCreatePost();
createPost(payload, { onSuccess: (res) => router.push(`/post/${res.id}`) });
```

### 3.6 Optimistic Update Pattern (Votes)

For instant UI feedback, vote hooks use the **optimistic update + rollback** pattern:

1. `onMutate`: Cancel related queries → snapshot current cache → apply optimistic update via `setQueryData`/`setQueriesData`.
2. `onError`: Roll back to snapshot.
3. `onSuccess`: Empty — no `invalidateQueries`. The optimistic state IS the final state (zero-refetch pattern).

**RULE:** Follow this exact pattern for all vote-like interactions. Do NOT `invalidateQueries` on success for optimistic mutations.

---

## 4. DIRECTORY STRUCTURE & ARCHITECTURE

```
src/
├── app/                        # Next.js App Router pages & layouts
│   ├── (auth)/                 # Auth pages: login, register, forgot-password, reset-password
│   ├── (main)/                 # Protected pages: feed, post, questions, profile, etc.
│   ├── (admin)/                # Admin panel routes
│   ├── (marketing)/            # Public marketing pages
│   ├── layout.tsx              # Root layout — Providers wrapper, fonts, metadata
│   └── not-found.tsx           # Global 404 page
│
├── components/                 # Reusable UI components
│   ├── ui/                     # shadcn/ui primitives (Button, Input, Card, etc.)
│   ├── post/                   # Post domain components (PostCard, PostForm, CommentSection)
│   ├── editor/                 # Markdown editor & viewer
│   ├── home/                   # Landing page components
│   ├── login/                  # Login form components
│   ├── main-layout/            # Shell layout (LeftSidebar, RightSidebar, MobileNav)
│   ├── navbar.tsx              # Top navigation bar
│   └── footer.tsx              # Site footer
│
├── services/                   # API service objects (one per backend controller)
│   ├── post-service.ts
│   ├── comment-service.ts
│   ├── account-service.ts
│   └── ...
│
├── hooks/                      # Custom React hooks (one directory per domain)
│   ├── post-hooks/             # TanStack Query hooks for Posts
│   │   ├── use-post-query-keys.ts
│   │   ├── use-create-post.ts
│   │   ├── use-get-posts-infinite.ts
│   │   └── index.ts            # Barrel export
│   ├── auth-hooks/
│   ├── comment-hooks/
│   ├── vote-hooks/
│   └── ...
│
├── types/                      # TypeScript interfaces (mirrors backend DTOs)
│   ├── common/                 # Shared: ReturnResult, Page, PagedData, BaseEntity
│   ├── post/                   # Create/Select/Update PostDTO
│   ├── comment/
│   ├── account/
│   ├── vote/
│   └── ...
│
├── store/                      # Redux Toolkit store
│   ├── store.ts                # configureStore — auth slice only
│   └── slices/
│       └── auth-slice.ts       # Auth state: tokens, user, isAuthenticated
│
├── providers/                  # React context providers
│   ├── providers.tsx           # Master provider: Theme > Redux > Auth > QueryClient > Toaster
│   └── auth-provider.tsx       # Hydrates Redux auth state from cookies on mount
│
├── lib/                        # Core utilities
│   ├── axiosConfig.ts          # Client-side Axios instance + interceptors
│   ├── server-api.ts           # Server-side fetch wrapper (serverPost)
│   ├── get-query-client.ts     # Cached QueryClient for SSR
│   └── utils.ts                # cn() utility for Tailwind class merging
│
├── constants/                  # Static config & enum-like values
│   ├── feed-payload.ts         # Default pagination payloads
│   ├── filterOperator.ts
│   ├── filterType.ts
│   └── sortOrderType.ts
│
├── styles/
│   └── globals.css             # Tailwind directives + custom design tokens
│
└── proxy.ts                    # Next.js 16 proxy (middleware replacement) — JWT verification + RBAC
```

### Where to Place New Code

| What you're adding | Where it goes |
|---|---|
| New API calls for `FooController` | `src/services/foo-service.ts` |
| TanStack Query hook for that service | `src/hooks/foo-hooks/use-{action}-foo.ts` |
| Query key factory | `src/hooks/foo-hooks/use-foo-query-keys.ts` |
| Backend DTO interfaces | `src/types/foo/create-foo-dto.ts`, `select-foo-dto.ts`, etc. |
| New page route | `src/app/(main)/foo/page.tsx` or appropriate route group |
| Reusable UI component | `src/components/foo/` directory |
| shadcn/ui primitive | `src/components/ui/` (auto-generated by shadcn CLI) |
| New Redux slice (rare) | `src/store/slices/` — only if truly global client state |
| Shared utility function | `src/lib/utils.ts` or new file in `src/lib/` |
| Constants / enums | `src/constants/` |
| Barrel export | Add `index.ts` in the hooks directory for public API |

---

## 5. STRICT CODING STANDARDS & ANTI-PATTERNS

### 5.1 TypeScript Rules

- **No `any` type.** Use `unknown` and narrow, or define a proper interface.
- **Interface naming:** Use PascalCase. DTOs end with `DTO` suffix matching the backend: `CreatePostDTO`, `SelectPostDTO`.
- **Interface location:** One file per DTO in `src/types/{domain}/`. Shared types go in `src/types/common/`.
- **Enums:** Use TypeScript `enum` for backend enum mappings (e.g., `PostType`, `SortOrderType`).
- **Generic constraints:** Always provide type parameters to `ReturnResult<T>`, `Page<T>`, `PagedData<T, TKey>`.

### 5.2 Component Rules — Server vs. Client

| Rule | Server Components | Client Components |
|---|---|---|
| Default in App Router | Yes (default) | Must add `'use client'` |
| Can use hooks | No | Yes |
| Can read cookies (SSR) | `next/headers` | No |
| Data fetching | `serverPost()` + `prefetchInfiniteQuery` | TanStack Query hooks |
| Can import Redux/Axios | NEVER | Yes |

**SSR Prefetch Pattern (MUST follow):**
```typescript
// page.tsx (Server Component)
export default async function FooPage() {
    const queryClient = getQueryClient();
    try {
        await queryClient.prefetchQuery({ queryKey: ..., queryFn: () => serverPost(...) });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error(error);
    }
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <FooClientComponent />
        </HydrationBoundary>
    );
}
```

### 5.3 Error Handling

**Backend business errors** (HTTP 200, `message` is non-null):
- Client-side: The Axios response interceptor auto-toasts `response.data.message`.
- Server-side: `serverPost()` throws `new Error(json.message)`.

**HTTP errors** (4xx/5xx):
- Axios response interceptor toasts `error.response.data.message`.
- 401 triggers the refresh flow automatically.

**Form validation errors:**
- Use `react-hook-form`'s built-in inline validation rules inside `register()` or `<Controller rules={{...}}>` (e.g., `required: "This field is required"`, `minLength: { value: 3, message: "Min 3 chars" }`).
- Display errors explicitly using the `errors` object from `formState` (e.g., `<p className="text-sm text-destructive">{errors.fieldName?.message}</p>`).
- **RULE:** Do NOT import or use external validation libraries like `zod` or `@hookform/resolvers`. Stick to React Hook Form's native validation.

**RULE:** Components MUST NOT try-catch API calls directly. Errors are handled by:
1. Axios interceptors (toast + refresh).
2. TanStack Query's `isError` / `error` state for UI rendering.
3. `react-hook-form` for input validation.

### 5.4 Anti-Patterns — NEVER Do These

#### Anti-Pattern 1: Fetching data inside presentational components

```typescript
// WRONG — mixing data fetching with presentation
function PostCard({ postId }: { postId: string }) {
    const { data } = useQuery({ queryKey: ['post', postId], queryFn: ... });
    return <div>{data?.title}</div>;
}

// CORRECT — container/presentational split
function PostCard({ post }: { post: SelectPostDTO }) {
    return <div>{post.title}</div>;
}
```

Components like `PostCard`, `PostListView` receive data as props. Data fetching happens in container components (`InfinitePostList`) or page-level prefetches.

#### Anti-Pattern 2: Using raw query key arrays

```typescript
// WRONG
useQuery({ queryKey: ['posts', 'list', filters], ... });

// CORRECT
useQuery({ queryKey: postQueryKeys.list(filters), ... });
```

Always use the domain's query key factory for consistency and correct cache invalidation.

#### Anti-Pattern 3: Importing client modules in Server Components

```typescript
// WRONG — importing Axios/Redux in a Server Component page.tsx
import api from '@/lib/axiosConfig';  // This pulls in js-cookie, Redux store!
import { store } from '@/store/store';

// CORRECT — use the server-only fetch wrapper
import { serverPost } from '@/lib/server-api';
```

Server Components MUST use `serverPost()` from `lib/server-api.ts`. NEVER import `axiosConfig.ts`, `js-cookie`, or the Redux store in server-side code.

#### Anti-Pattern 4: Putting server data in Redux

```typescript
// WRONG — storing fetched posts in Redux
dispatch(setPosts(fetchedPosts));

// CORRECT — TanStack Query manages server state
const { data: posts } = useGetPostsInfinite(payload);
```

Redux is **exclusively** for auth state. All server data lives in TanStack Query's cache.

#### Anti-Pattern 5: Inventing backend endpoints

```typescript
// WRONG — assuming an endpoint exists
const { data } = await api.get('/Posts/search?q=hello');  // This endpoint doesn't exist!

// CORRECT — use only known endpoints from src/services/
const { data } = await api.post('/Posts/paging', payloadWithFilters);
```

Only use endpoints that are already defined in `src/services/*.ts` or explicitly confirmed from the backend team. When in doubt, check the existing service files.

### 5.5 Additional Mandatory Rules

- **Use `cn()` for conditional classes.** Never build class strings with template literals and ternaries directly. Use the `cn()` utility from `lib/utils.ts`.
- **Icons:** Only use `lucide-react`. Do not install or use Font Awesome, Heroicons, or others.
- **Toasts:** Only use `toast()` from `sonner`. Do not use `alert()`, `window.confirm()`, or introduce other toast libraries.
- **Routing:** Use `next/navigation` hooks (`useRouter`, `useSearchParams`, `usePathname`). NEVER use `next/router` (that's Pages Router).
- **Images:** Use `next/image` `<Image>` component. Remote patterns are restricted in `next.config.ts` — do not add wildcard hostnames.
- **Cookie handling (client):** Use `js-cookie` (`Cookies.get/set/remove`). Do not use `document.cookie` directly.
- **Cookie handling (server):** Use `cookies()` from `next/headers`. Never import `js-cookie` in server code.
- **Pagination payload:** Use `Page<string>` interface for all paging requests. Reuse constants from `src/constants/feed-payload.ts`.
- **Barrel exports:** Each hooks directory should have an `index.ts` barrel file exporting public hooks.
- **File Naming:** ALL files and directories MUST use `kebab-case` (e.g., `post-card.tsx`, `use-get-posts.ts`, `select-post-dto.ts`). NEVER use `PascalCase` or `camelCase` for filenames (e.g., `PostCard.tsx`, `useCreatePost.ts` are FORBIDDEN).
- **Import Paths:** Always use absolute imports with the `@/` alias (e.g., `import { Button } from '@/components/ui/button'`). NEVER use relative paths (`../../`) for importing files outside the current directory. Relative imports (`./sibling`) are acceptable only within the same directory.

---

## Appendix A: Provider Hierarchy

```
<html>
  <body>
    <Providers>                         ← src/providers/providers.tsx ('use client')
      <ThemeProvider>                   ← next-themes
        <ReduxProvider store={store}>   ← Redux Toolkit
          <AuthProvider>                ← Hydrates auth from cookies on mount
            <QueryClientProvider>       ← TanStack Query
              {children}
              <ReactQueryDevtools />    ← Dev only
              <Toaster />              ← Sonner toast container
            </QueryClientProvider>
          </AuthProvider>
        </ReduxProvider>
      </ThemeProvider>
    </Providers>
  </body>
</html>
```

## Appendix B: Pagination Types

```typescript
// Page<T> — request payload for paginated queries
interface Page<T> {
    size: number;
    pageNumber: number;
    totalElements: number;
    orders?: OrderMapping[];
    filter?: FilterMapping[];
    selected?: T[];
}

// PagedData<T, TKey> — response shape from paginated queries
interface PagedData<T, TKey> {
    data: T[];
    page: Page<TKey>;
}
```

## Appendix C: Auth State Shape

```typescript
interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    user: User | null;
}

interface User {
    id: string;
    userName: string;
    profileId?: string;
    roles: string[];
}
```

---

## 5.6 Frontend Styling & Design System

> **⚠️ ALL frontend styling details have been consolidated into `devnexus-setup-guide.md`.**
>
> Do NOT use this section. Instead, refer to the complete guide at `docs/devnexus-setup-guide.md` for:
> - CSS variable system and token usage
> - Custom utility classes (`btn-ai`, `card-ai`, `badge-*`, etc.)
> - Dark mode implementation
> - Component patterns and styling conventions
> - Anti-patterns and what NOT to do

---

## 6. 🎨 Frontend UI/UX Design System

> **⚠️ CRITICAL — ALL FRONTEND TASKS MUST FOLLOW THIS SECTION EXACTLY**

### 6.1 Design System Authority

The complete frontend design system (colors, components, utilities, animations, and best practices) is documented in **`devnexus-setup-guide.md`** in the `/docs/` folder.

**MANDATORY DIRECTIVE:** For ANY frontend code generation, modification, or review task — whether it's:
- Building pages (`/feed`, `/admin`, `/profile`, etc.)
- Creating components (cards, buttons, forms, modals)
- Adding admin or moderator interfaces
- Implementing AI features
- Styling any user-facing element

**The agent MUST:**

1. **Read `devnexus-setup-guide.md` first.** This guide contains the authoritative design system, CSS variable architecture, and all custom Tailwind utilities.

2. **Never use generic Tailwind colors or hardcoded hex values.** Only use:
   - CSS variable-backed utilities: `bg-background`, `bg-card`, `text-foreground`, `text-muted`, `border-border`, etc.
   - Custom utility classes: `bg-page`, `card`, `card-hover`, `card-ai`, `btn-primary`, `btn-ghost`, `btn-ai`, `badge-default`, `badge-emerald`, etc.
   - The exact color palette defined in the setup guide (indigo for primary, emerald-cyan for AI features, red for admin, purple for moderators).

3. **Never use inline `style` attributes** for colors, borders, backgrounds, or shadows. All styling must come from Tailwind classes and the design token system defined in `globals.css`.

4. **Never compose button, card, or badge styles ad-hoc** from multiple Tailwind utilities. Always use the pre-built utility classes (`btn-ai`, `card-ai`, `badge-red`, etc.) defined in the setup guide.

5. **Enforce dark mode via CSS variables, not manual `dark:` overrides.** Surfaces (`bg-page`, `bg-card`, `bg-input`) and text (`text-heading`, `text-body`, `text-muted`) automatically switch between themes because they reference CSS variables that have separate light/dark values.

### 6.2 Core Design Principles

- **Semantic tokens over arbitrary colors:** All colors map to meaningful CSS variables (`--background`, `--primary`, `--destructive`, etc.) that can be easily updated globally.
- **Pre-built utilities > ad-hoc composition:** The design system provides `btn-ai`, `card-ai`, `badge-red`, `glow-ai`, etc. — use these instead of rebuilding the same styles repeatedly.
- **Mandatory Sparkles icon on all AI features:** Every AI button, panel, or feature MUST include a `<Sparkles>` icon from `lucide-react`.
- **Font-mono for technical elements:** ALL tech tags, @usernames, code snippets, file paths, and version numbers MUST use `font-mono` class.
- **Role-based badge colors:** Admin users display `badge-red` with `<Shield>` icon; Moderators display `badge-purple` with `<Shield>` icon.

### 6.3 When in Doubt

If you encounter a styling question or are unsure which class to use:

1. **Check the Quick Reference table in `devnexus-setup-guide.md`, Section 12** — it lists all common scenarios (page bg, card bg, buttons, badges, etc.) and the exact class to use.
2. **Review the complete example component in Section 7 of the setup guide** — it shows a fully compliant post card with all patterns applied correctly.
3. **If the class doesn't exist in the guide, DO NOT invent it.** Instead, check if an existing utility can be combined with standard Tailwind modifiers, or ask for clarification before proceeding.

### 6.4 Enforcement

- **Code review must verify all styling adheres to this design system.** Any use of hex colors, arbitrary Tailwind values, inline styles, or non-standard utility classes should be flagged and rejected.
- **Agents must cite the specific section or table from `devnexus-setup-guide.md`** when justifying styling choices.
- **No exceptions:** Even for one-off components or rapid prototyping, the design system must be followed strictly. Consistency across the entire frontend is non-negotiable.

---

**Reference:** Consult `devnexus-setup-guide.md` (in `/docs/`) for the complete design system, CSS variable architecture, and implementation patterns. This file is your authoritative source for all frontend styling decisions.
