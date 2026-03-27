# مجلس (Majlis)
مجلس هي منصة تواصل اجتماعي عربية قائمة على الخصوصية.

## Tech stack
- Next.js (app directory)
- Supabase (Database, Auth, Storage)
- Tailwind CSS
- TypeScript
- JSON Web Tokens (jose / jsonwebtoken)
- Other: bcryptjs, FontAwesome

## Important environment variables
Set these in a .env (or on your hosting platform):
- NEXT_PUBLIC_SUPABASE_URL — your Supabase URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY — (optional for client-side features)
- SUPABASE_SERVICE_ROLE_KEY — server-side service role key used by lib/supabaseClient.ts
- JWT_SECRET — secret for signing/verifying JWTs
- NEXT_PUBLIC_APP_URL — (optional) canonical site URL for redirects if needed

Note: lib/supabaseClient.ts currently initializes Supabase with the service role key — keep that key secure and do not expose it to client-side code.

## Setup & run
1. Install dependencies:
   - npm install
2. Development:
   - npm run dev
3. Build & start:
   - npm run build
   - npm run start
4. Lint:
   - npm run lint

## Storage & media
- Uploaded images are stored in Supabase storage bucket named `posts-media`.
- Avatars and post media paths are placed under this bucket; deleting posts removes files by parsing public URLs and deleting the corresponding objects.

## Middleware behavior
- middleware.ts checks cookie `token` and uses `jose` to verify against `JWT_SECRET`.
- Public routes: `/login`, `/register`. Open route example: `/privacy`.
- Unauthenticated users are redirected to `/login`; authenticated users trying to access public auth routes are redirected to `/`.

Browse the `app/api` folder for full details and request/response formats.

## Project organization
- app/ — Next.js App Router pages & API routes
- app/fonts/ — local font files (ashkal, Tajawal used)
- app/globals.css — global styles (Tailwind)
- lib/ — shared helpers (supabase client)
- postcss.config.mjs — PostCSS/Tailwind config
- public/ — static assets (if any)

