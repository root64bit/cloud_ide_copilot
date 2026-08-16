# GitHub App Setup & Configuration

The platform interacts with GitHub exclusively through a **GitHub App**, avoiding long-lived Personal Access Tokens (PATs).

---

## 1. Create a GitHub App

1. Navigate to **GitHub Settings** > **Developer Settings** > **GitHub Apps** > **New GitHub App**.
2. Configure App Settings:
   - **GitHub App Name**: `AI Engineering Copilot` (or your company name).
   - **Homepage URL**: `https://engineering.example.com`.
   - **Callback URL**: `https://engineering.example.com/api/auth/callback/github`.
   - **Webhook URL**: `https://engineering.example.com/api/webhooks/github`.
   - **Webhook Secret**: Generate a cryptographically secure 32+ character random string.

---

## 2. Permissions Required

Configure minimum necessary permissions:

| Permission | Access | Purpose |
|---|---|---|
| **Repository Contents** | Read & Write | Read commits, create repair branches, commit fixes |
| **Pull Requests** | Read & Write | Open repair PRs, update PR status, merge upon human approval |
| **Metadata** | Read-Only | Discover repositories and installations |
| **Commit Statuses** | Read-Only | Verify CI checks |

---

## 3. Generate Private Key

1. Under **Private keys**, click **Generate a private key**.
2. Download the `.pem` file.
3. Save the private key in your environment variables:
   ```env
   GITHUB_APP_ID=123456
   GITHUB_APP_CLIENT_ID=Iv1...
   GITHUB_APP_CLIENT_SECRET=...
   GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
   GITHUB_APP_WEBHOOK_SECRET=...
   ```

---

## 4. Installation Workflow

1. Install the GitHub App on your personal account or organization.
2. Select the specific repositories you want to connect (e.g. `OneDealer`, `YAKA`, `casadepeneus`).
3. The platform receives the `installation.created` webhook and registers accessible repositories.
