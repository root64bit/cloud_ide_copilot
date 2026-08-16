-- ==============================================================================
-- Development & Testing Seed Fixtures
-- ==============================================================================

-- Test Organization
INSERT INTO public.organizations (id, name, slug, created_by)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Engineering', 'acme-corp', '00000000-0000-0000-0000-0000000000aa')
ON CONFLICT (id) DO NOTHING;

-- Organization Members (Owner, Admin, Engineer, Viewer)
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000aa', 'owner'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000bb', 'admin'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000cc', 'engineer'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000dd', 'viewer')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Test Projects (OneDealer, YAKA, casadepeneus)
INSERT INTO public.projects (
    id, organization_id, name, slug, description,
    repository_provider, repository_owner, repository_name, repository_id, default_branch,
    deployment_provider, vercel_project_id, production_domain,
    package_manager, install_command, test_command, lint_command, typecheck_command, build_command, dev_command
)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'OneDealer',
        'onedealer',
        'Automotive dealership management platform on Next.js and Supabase',
        'github', 'acme-inc', 'onedealer', 84920192, 'main',
        'vercel', 'prj_onedealer_prod', 'onedealer.example.com',
        'npm', 'npm ci', 'npm test', 'npm run lint', 'npx tsc --noEmit', 'npm run build', 'npm run dev'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'YAKA',
        'yaka',
        'High-volume micro-payments & commerce app',
        'github', 'acme-inc', 'yaka', 84920193, 'main',
        'vercel', 'prj_yaka_prod', 'yaka.example.com',
        'npm', 'npm ci', 'npm test', 'npm run lint', 'npx tsc --noEmit', 'npm run build', 'npm run dev'
    )
ON CONFLICT (id) DO NOTHING;

-- Test Incident
INSERT INTO public.incidents (
    id, organization_id, project_id, provider, external_issue_id,
    title, level, environment, release, commit_sha, culprit,
    status, first_seen_at, last_seen_at, occurrence_count, sanitized_metadata
)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'sentry',
    'ISSUE-9284',
    'TypeError: Cannot read properties of undefined (reading ''discountCode'')',
    'error',
    'production',
    'v1.4.2',
    'a9f82d1c5e4b7890123456789abcdef012345678',
    'src/lib/checkout/pricing.ts in calculateTotal',
    'unresolved',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '5 minutes',
    42,
    '{
        "stacktrace": [
            {"filename": "src/lib/checkout/pricing.ts", "lineno": 48, "function": "calculateTotal"},
            {"filename": "src/app/api/checkout/route.ts", "lineno": 112, "function": "POST"}
        ],
        "tags": {"browser": "Chrome 122", "os": "iOS 17.3"}
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
