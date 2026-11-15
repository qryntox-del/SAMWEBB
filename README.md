# SAM® — Independent Developer Portfolio

A refined light-grey / white / silver portfolio with live project pages, services, contact inquiries, responsive animations, and a private content dashboard. **Built without npm dependencies**, so a stuck `create-next-app` installation is not a blocker.

## Run immediately on Windows (VS Code)

1. Extract the ZIP. Open the **sam-portfolio** folder in VS Code (`File > Open Folder`).
2. Open Terminal (`Ctrl + backtick`).
3. Run:

   ```powershell
   node server.mjs
   ```

4. Open **http://localhost:5500** in Chrome.
5. For the dashboard, open **http://localhost:5500/admin.html**.
6. Stop the server with `Ctrl+C`.

Double-click `START_HERE_WINDOWS.bat` as an alternative. Requires Node.js on your PC; verify with `node -v`. **No `npm install`, `npx create-next-app`, Tailwind installation, or database setup is needed to preview.**

## What works in local preview mode?

- Home, Work, Project case-study pages, Services, About and Contact
- Mobile responsive navigation and subtle animation
- Example project previews with original SVG illustrations; clearly labeled *Concept / sample*
- Project create / edit / delete / reorder / publish / unpublish
- Headline, about, contact, availability, skills and services editing
- Inquiry form + inbox **stored in the same browser only**
- JSON export / import of preview content from the dashboard

**Important:** Preview mode has **no genuine admin protection or online data persistence**. It is just a design/test sandbox and **must not be treated as a production admin/inquiry system**. If someone submits the website's contact form on their device before Supabase is connected, the submission is saved only to THEIR browser and will not reach you. Connect Supabase before launching to clients.

## Make it a real production portfolio: Supabase

1. Sign up at https://supabase.com and create a project.
2. Open Supabase → SQL Editor. Copy/paste and run **`supabase/schema.sql`**. It creates projects, settings, inquiries, RLS policies, and a `portfolio` image storage bucket.
3. Go to Authentication → Users → **Add user**. Create YOUR owner user with a strong password. **Disable public signups** in Auth settings.
4. Copy that user's UUID from Supabase Authentication → Users. In SQL Editor, run (replace the placeholder):

   ```sql
   insert into public.admins (id)
   values ('YOUR-REAL-AUTH-USER-UUID');
   ```

5. In Supabase → Project Settings → Data API / API Keys, locate Project URL and **publishable/anon** key.
6. Open **`site/js/config.js`** and fill the two values:

   ```js
   export const CONFIG = {
     supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
     supabaseAnonKey: 'YOUR-PUBLIC-ANON-KEY',
   };
   ```

   The anon/publishable key is designed for client-side use with strong RLS. **NEVER paste a service_role or secret key into this file.**
7. Refresh the website and `/admin.html`. Sign in as your created owner account.
8. Create real published projects in the admin and submit a sample contact form. Verify the new inquiry appears in the admin inbox.

Project and inquiry data are stored in Supabase once connected. **Local demo data are not automatically synced to the database**; use the dashboard to enter your real project details. The sample visuals in `/assets` can be kept for inspiration, but should be replaced with real screenshots before marketing to clients.

### Security and deployment notes

- RLS grants public read **only to published projects**, public write **only to new inquiries**, and admin project/inbox actions **only to a listed admin user**.
- The `/admin.html` path is public to load, but unauthorized users cannot access privileged records in Supabase. Never rely on a secret dashboard URL as security.
- Protect from spam as your site grows using CAPTCHA or edge rate limits. Basic honeypot and form validation are included, not production-grade spam defense.
- Only public contact details are stored in site settings. Never store passwords or private secrets there.
- Images upload to public Supabase Storage and are viewable by anyone with the URL.
- Uploaded files are not automatically deleted from Supabase Storage when a project is removed. Remove unused images via the Supabase dashboard if necessary.
- Run an accessibility and browser check after replacing sample copy/images.

## Deploy to Vercel

You do **not** need to deploy `server.mjs`. This is a static site hosted from the **site/** folder:

1. Push the project to GitHub.
2. Import it in Vercel → New Project.
3. Framework preset: **Other**.
4. No installation command and no build command.
5. Output Directory: **`site`**.
6. Deploy, then test all pages and the inquiry form on the public domain.

If your hosting service doesn't support a custom static output directory, upload only the contents of `site/` as the public website root. Never deploy your local preview data file or secret credentials. The Supabase publishable key is not a secret; privileged keys are.

## How to update your work

After connecting Supabase: go to `/admin.html` → Projects → Add project → enter real project title, category, accurate description, image, tools, features, and live URL. Toggle **Published** and **Featured** as needed, then Save. Refresh the homepage: changes are visible without changing source code.

The owner can also edit the home headline, About, services, email and social links under **Site settings**.

## Folders

- `site/index.html` — homepage
- `site/work.html` — all projects
- `site/project.html` — case-study details
- `site/admin.html` — preview/secure content manager
- `site/css/style.css` — all responsive design and animation
- `site/js/main.js` — public website rendering
- `site/js/admin.js` — portfolio dashboard
- `site/js/api.js` — browser-local mode or real Supabase API
- `site/js/config.js` — database public connection values
- `site/js/data.js` — example projects and copy
- `site/assets` — original SVG illustration assets
- `supabase/schema.sql` — backend tables and security rules
- `server.mjs` — dependency-free localhost preview server

## If the browser is blank

- Confirm `node -v` works.
- Start **inside the extracted `sam-portfolio` folder**.
- Use `http://localhost:5500` (not `file:///...`); ES modules need a web server.
- Press F12 → Console to see errors; if you filled Supabase URL/key, check their values and your RLS setup.
- If port 5500 is occupied: in Windows PowerShell run `$env:PORT=5501; node server.mjs` and open `http://localhost:5501`.

This package uses only native browser JS, HTML, CSS, and built-in Node.js for the preview server. No package download is needed.

## V3 — Light portfolio refresh

The website now uses a clean white / light grey design with Plus Jakarta Sans display typography. All existing project editor, content settings, and case-study functionality remains available.

A public search button opens a navigation overlay. Searching for the exact term `sam` and pressing Enter **navigates to `/admin.html`**. **This is not an authentication mechanism**. In preview mode the admin dashboard is local-only; on a real published website, Supabase authentication and RLS must be configured to protect edits and client inquiries.

Original `site/css/style.css` is preserved. Changes are in `site/css/light.css` and `site/js/site-search.js` and links in HTML.

## V4: contact, photo and owner dashboard

- Owner email: `qryntox@gmail.com`. Public WhatsApp: `8590665753` (India +91). Both are editable under **Admin → Profile & settings**.
- Hero and About use the same uploaded photo. Until upload, a tasteful SAM monogram appears instead.
- In local preview, submissions save only to the current browser; **they do not email the owner**. Visitors can explicitly use **Send via WhatsApp** or **Send via email**, which opens their messaging app with a prefilled message. They still must press Send.
- When Supabase is connected, the Submit button stores inquiries in Supabase. It does **not** automatically send an email or WhatsApp notification. Admin → Client inquiries has email/WhatsApp reply links. WhatsApp reply appears when visitors provide a number with a leading +country code.
- Existing Supabase users should run `supabase/upgrade_v4.sql` before publishing this update to add the optional phone column. New users can run `supabase/schema.sql` directly.
- Existing local project edits are stored in the same browser key; do not clear browser site data. The patch does not overwrite `site/js/config.js`.
- Important: `/admin.html` keyword shortcut is navigation, **not authentication**. Local preview is unprotected. Connect Supabase and verify RLS, authentication and form spam protection prior to public launch.
