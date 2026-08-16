# Vercel Integration & Preview Environments

The platform integrates with Vercel for monitoring production deployments, triggering preview builds on repair branches, and querying deployment URLs.

---

## 1. Authentication & API Tokens

1. Generate a Vercel API Token with access to your team or account.
2. In your `.env.local`:
   ```env
   VERCEL_API_TOKEN=your-vercel-api-token
   VERCEL_TEAM_ID=team_yourteamid
   ```

---

## 2. Preview Deployments Workflow

1. When a repair PR is created (e.g. branch `ai-repair/onedealer-fix-9284`), Vercel automatically detects the new branch and triggers a Preview Deployment.
2. The platform's `DeploymentProvider` polls the Vercel API or listens to deployment webhooks.
3. Once the deployment state reaches `READY`, the preview URL (e.g. `https://onedealer-preview-pr-101.vercel.app`) is displayed on the Repair Workspace screen.
4. Engineers can click **Test Preview** to verify the fix before submitting for human production approval.

---

## 3. Deployment Provider Interface

Implemented in `src/server/providers/deployment/vercel.provider.ts`:
- `getProject(projectId, teamId)`
- `getDeployments(projectId, limit, teamId)`
- `getDeploymentStatus(deploymentId, teamId)`
- `getPreviewUrl(projectId, branchName, teamId)`
