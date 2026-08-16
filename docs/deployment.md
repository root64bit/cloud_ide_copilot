# Production Deployment Guide

Instructions for deploying the AI Engineering Platform to Vercel and connecting Supabase.

---

## 1. Database Setup (Supabase)

1. Create a new Supabase project.
2. In the Supabase SQL Editor, run the database migrations in order:
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rls_policies.sql`
   - `supabase/migrations/00003_audit_triggers.sql`
   - `supabase/migrations/00004_project_memory.sql`
3. Optionally run `supabase/seed.sql` for initial seed data.

---

## 2. Deploy to Vercel

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Configure the environment variables (see `docs/environment-variables.md`).
4. Set Framework Preset: `Next.js`.
5. Deploy.

---

## 3. Webhook Endpoints Configuration

- **Sentry Alert Rule Webhook**: Point to `https://engineering.example.com/api/webhooks/sentry`
- **GitHub App Webhook**: Point to `https://engineering.example.com/api/webhooks/github`
