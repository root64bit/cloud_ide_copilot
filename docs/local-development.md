# Local Development Guide

Step-by-step instructions for running the AI Engineering Platform locally.

---

## 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm** or **pnpm**
- **Git**
- Optional: Supabase CLI / Docker (for local PostgreSQL testing)

---

## 2. Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in local or staging API credentials (or use mock fallbacks included in provider layers).

---

## 3. Install Dependencies & Run Tests

1. Install project dependencies:
   ```bash
   npm install
   ```
2. Run the automated test suite:
   ```bash
   npm test
   ```
3. Run TypeScript typechecking:
   ```bash
   npm run typecheck
   ```

---

## 4. Run Next.js Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Default test organization: `acme-corp` (`http://localhost:3000/acme-corp`)
- Default connected project: `onedealer` (`http://localhost:3000/acme-corp/projects/onedealer`)
- Interactive Repair Workspace: `http://localhost:3000/acme-corp/workspaces/ws_onedealer_repair_1`
