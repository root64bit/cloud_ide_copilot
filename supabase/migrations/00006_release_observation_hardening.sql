-- Release observation hardening
-- Stores the exact GitHub merge commit so the production observer can prove that
-- the Vercel production deployment corresponds to the human-approved repair.

ALTER TABLE public.pull_requests
  ADD COLUMN IF NOT EXISTS merge_commit_sha TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS deployments_external_deployment_id_key
  ON public.deployments(external_deployment_id);

CREATE INDEX IF NOT EXISTS idx_pull_requests_merge_commit_sha
  ON public.pull_requests(merge_commit_sha)
  WHERE merge_commit_sha IS NOT NULL;

-- The current release workflow creates at most one canonical repair PR per workspace.
CREATE UNIQUE INDEX IF NOT EXISTS pull_requests_workspace_id_key
  ON public.pull_requests(workspace_id);

-- Prevent concurrent Sentry deliveries from creating duplicate canonical incidents.
CREATE UNIQUE INDEX IF NOT EXISTS incidents_project_provider_external_issue_key
  ON public.incidents(project_id, provider, external_issue_id);
