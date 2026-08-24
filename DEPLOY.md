# GameHub Deployment Checklist

## 1. Push to GitHub

```powershell
git remote add origin https://github.com/<your-username>/gamehub.git
git push -u origin master
```

## 2. Deploy backend on Render (free)

1. Sign up at render.com with GitHub
2. New + → Blueprint → pick the `gamehub` repo (it reads `render.yaml`)
3. Fill env vars when prompted:
   - `DATABASE_URL` → your Supabase transaction-pooler string
   - `ADMIN_KEY` → same long random string as local
4. Deploy. Health check: `<render-url>/api/health` should say `"db":"configured"`

## 3. Point Supabase at Render

Nothing to change — Supabase allows remote connections by default.
If you restricted IPs, allow `0.0.0.0/0` (pooler uses shared egress).

## 4. Google OAuth for production

console.cloud.google.com → your OAuth client:
- Authorized redirect URI #2: `https://<render-url>/api/auth/google/callback`
- In Render env vars add: `PUBLIC_BASE_URL=https://<render-url>`

## 5. Frontend + domain

The Node server serves the whole site, so one Render URL is enough.

Custom domain:
1. Buy domain (e.g. Namecheap ~$9/yr)
2. Render → Settings → Custom Domains → add `www.yourdomain.com`
3. At your registrar create the CNAME record Render shows
4. Add `PUBLIC_BASE_URL=https://www.yourdomain.com` in Render after DNS verifies
5. Submit `https://www.yourdomain.com/sitemap.xml` in Google Search Console

## 6. Post-launch smoke test

- [ ] Home page loads, checker gives a verdict
- [ ] Register + sign in, rig syncs (check Supabase Table Editor)
- [ ] /admin/ unlocks, drafts list loads
- [ ] Mods section shows verdict chips
- [ ] /g/gta-v renders the SEO page
- [ ] /sitemap.xml lists every game page
