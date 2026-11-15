# SAM Portfolio V6 — Live deployment safety patch

This patch only adds four files. It **does not modify** your firebase-config.js, Firebase UID, firestore.rules, project data, JavaScript, HTML or CSS.

## What it adds
- `vercel.json`: tells Vercel that the public site is in the `site` directory, and sets basic security headers; `/admin.html` remains accessible but must be protected by Firebase Auth + Firestore rules.
- `.gitignore`: avoids accidentally committing local backup/credential files in future commits. This does not remove any files already committed.
- `VERIFY_LIVE_SITE.ps1`: read-only test of public routes; enter your actual deployed Vercel URL.
- This README.

## Apply safely
1. Confirm your project path: `C:\samex\portfolio-code\sam-portfolio`.
2. Back up any existing `vercel.json` and `.gitignore` before copying the patch.
3. Extract the patch ZIP into the project folder; verify the four files are present.
4. From the project root, run `git status --short` to inspect changes. **Never use `git add -A` without checking what it will include**; it may include local backup files that were already tracked.
5. Stage only these deployment files: `git add vercel.json .gitignore VERIFY_LIVE_SITE.ps1 DEPLOY_V6_README.md`
6. Commit/push on the branch Vercel tracks (usually `main`): `git commit -m "Configure Vercel static site deployment"` and `git push`.
7. Vercel normally redeploys when a connected tracked branch receives a commit.

## Production smoke test
Run in PowerShell:

```powershell
.\VERIFY_LIVE_SITE.ps1 -Url "https://YOUR-REAL-SITE.vercel.app"
```

The script checks routes. It cannot verify Firebase Auth security or write permissions. Manually check those in browser. Do not publish your owner password or Firebase service-account private keys.

### Firebase login on the live URL
Firebase Console > Authentication > Settings > Authorized domains > Add domain, using just the **hostname** shown by Vercel (not `https://` and not the `/admin.html` path).

### Firebase Storage
Your Firestore project saves can work without Firebase Storage. For now, add public HTTPS image URLs to your profile/project editor if Storage is not enabled. Do not put Firebase Storage secrets in your HTML or JS. The Firebase web app config identifiers are intended for browser use, with Security Rules providing access control.

### If Vercel was already configured successfully
Compare your existing Vercel configuration and project root/output directory with this patch before pushing. Do not blindly replace a working `vercel.json` from an alternative setup.
