import { redactSecrets } from "@/lib/security/redaction";

export type OpenHandsStartStatus =
  | "WORKING"
  | "WAITING_FOR_SANDBOX"
  | "PREPARING_REPOSITORY"
  | "RUNNING_SETUP_SCRIPT"
  | "SETTING_UP_GIT_HOOKS"
  | "SETTING_UP_SKILLS"
  | "STARTING_CONVERSATION"
  | "READY"
  | "ERROR";

export type OpenHandsExecutionStatus =
  | "idle"
  | "running"
  | "paused"
  | "waiting_for_confirmation"
  | "finished"
  | "error"
  | "stuck"
  | string;

export interface OpenHandsStartTask {
  id: string;
  status: OpenHandsStartStatus;
  detail?: string | null;
  app_conversation_id?: string | null;
  sandbox_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OpenHandsConversation {
  id: string;
  sandbox_status?: string | null;
  execution_status?: OpenHandsExecutionStatus | null;
  selected_repository?: string | null;
  selected_branch?: string | null;
  title?: string | null;
  [key: string]: unknown;
}

export interface OpenHandsConversationResult {
  startTaskId: string;
  conversationId: string;
  sandboxId?: string;
  executionStatus: OpenHandsExecutionStatus;
  conversationUrl: string;
}

export interface StartOpenHandsConversationInput {
  repository: string;
  branch?: string;
  message: string;
  model?: string;
  observabilityTags?: string[];
  observabilityMetadata?: Record<string, string | number | boolean>;
}

export interface OpenHandsCloudClientOptions {
  baseUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  startTimeoutMs?: number;
  executionTimeoutMs?: number;
  pollIntervalMs?: number;
}

const TERMINAL_EXECUTION_STATES = new Set([
  "finished",
  "error",
  "stuck",
  "waiting_for_confirmation",
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export class OpenHandsCloudClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly startTimeoutMs: number;
  private readonly executionTimeoutMs: number;
  private readonly pollIntervalMs: number;

  constructor(options: OpenHandsCloudClientOptions = {}) {
    this.baseUrl = (options.baseUrl || process.env.OPENHANDS_API_URL || "https://app.all-hands.dev").replace(/\/$/, "");
    this.apiKey = options.apiKey || process.env.OPENHANDS_API_KEY || process.env.OPENHANDS_CLOUD_API_KEY || "";
    this.fetchImpl = options.fetchImpl || fetch;
    this.startTimeoutMs = options.startTimeoutMs || Number(process.env.OPENHANDS_START_TIMEOUT_MS || 5 * 60_000);
    this.executionTimeoutMs = options.executionTimeoutMs || Number(process.env.OPENHANDS_EXECUTION_TIMEOUT_MS || 45 * 60_000);
    this.pollIntervalMs = options.pollIntervalMs || Number(process.env.OPENHANDS_POLL_INTERVAL_MS || 5_000);
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  getConversationUrl(conversationId: string) {
    return `${this.baseUrl}/conversations/${encodeURIComponent(conversationId)}`;
  }

  private headers() {
    if (!this.apiKey) {
      throw new Error("OpenHands Cloud is not configured. Set OPENHANDS_API_KEY in the server environment.");
    }

    // OpenHands Cloud overview documents Authorization: Bearer while the generated
    // REST reference documents X-Access-Token. Supplying both keeps the client
    // compatible with the current Cloud deployment and self-hosted V1 servers.
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "X-Access-Token": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(this.headers());
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    const text = await response.text();
    if (!response.ok) {
      const safeBody = redactSecrets(text).slice(0, 2_000);
      throw new Error(`OpenHands API request failed (${response.status} ${response.statusText}): ${safeBody}`);
    }

    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }

  async healthCheck(): Promise<{ configured: true; reachable: true }> {
    await this.request<unknown>("/api/v1/app-conversations/search?limit=1", { method: "GET" });
    return { configured: true, reachable: true };
  }

  async startConversation(input: StartOpenHandsConversationInput): Promise<OpenHandsStartTask> {
    const body: Record<string, unknown> = {
      initial_message: {
        role: "user",
        content: [{ type: "text", text: input.message }],
        run: true,
      },
      selected_repository: input.repository,
      public: false,
      observability_span_name: "cloud_ide_copilot_repair",
      observability_tags: input.observabilityTags || ["cloud-ide-copilot", "repair"],
      observability_metadata: input.observabilityMetadata || {},
    };

    if (input.branch) body.selected_branch = input.branch;
    if (input.model) body.llm_model = input.model;

    return this.request<OpenHandsStartTask>("/api/v1/app-conversations", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getStartTask(startTaskId: string): Promise<OpenHandsStartTask | null> {
    const result = await this.request<OpenHandsStartTask[] | OpenHandsStartTask>(
      `/api/v1/app-conversations/start-tasks?ids=${encodeURIComponent(startTaskId)}`,
      { method: "GET" }
    );

    return asArray(result)[0] || null;
  }

  async getConversation(conversationId: string): Promise<OpenHandsConversation | null> {
    const result = await this.request<OpenHandsConversation[] | OpenHandsConversation>(
      `/api/v1/app-conversations?ids=${encodeURIComponent(conversationId)}`,
      { method: "GET" }
    );

    return asArray(result)[0] || null;
  }

  async waitUntilReady(startTask: OpenHandsStartTask): Promise<{ conversationId: string; sandboxId?: string }> {
    if (startTask.status === "ERROR") {
      throw new Error(`OpenHands failed to start: ${startTask.detail || "unknown startup error"}`);
    }

    if (startTask.status === "READY" && startTask.app_conversation_id) {
      return {
        conversationId: startTask.app_conversation_id,
        sandboxId: startTask.sandbox_id || undefined,
      };
    }

    const deadline = Date.now() + this.startTimeoutMs;
    while (Date.now() < deadline) {
      const current = await this.getStartTask(startTask.id);
      if (!current) {
        await sleep(this.pollIntervalMs);
        continue;
      }

      if (current.status === "ERROR") {
        throw new Error(`OpenHands failed to start: ${current.detail || "unknown startup error"}`);
      }

      if (current.status === "READY" && current.app_conversation_id) {
        return {
          conversationId: current.app_conversation_id,
          sandboxId: current.sandbox_id || undefined,
        };
      }

      await sleep(this.pollIntervalMs);
    }

    throw new Error(`Timed out waiting for OpenHands conversation startup after ${this.startTimeoutMs}ms`);
  }

  async waitForCompletion(conversationId: string): Promise<OpenHandsConversation> {
    const deadline = Date.now() + this.executionTimeoutMs;

    while (Date.now() < deadline) {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        await sleep(this.pollIntervalMs);
        continue;
      }

      if (conversation.sandbox_status === "ERROR" || conversation.sandbox_status === "MISSING") {
        throw new Error(`OpenHands sandbox entered terminal status '${conversation.sandbox_status}'`);
      }

      const executionStatus = String(conversation.execution_status || "idle").toLowerCase();
      if (TERMINAL_EXECUTION_STATES.has(executionStatus)) {
        if (executionStatus !== "finished") {
          throw new Error(
            executionStatus === "waiting_for_confirmation"
              ? `OpenHands is waiting for confirmation. Continue in ${this.getConversationUrl(conversationId)}`
              : `OpenHands execution ended with status '${executionStatus}'`
          );
        }
        return conversation;
      }

      await sleep(this.pollIntervalMs);
    }

    throw new Error(`Timed out waiting for OpenHands execution after ${this.executionTimeoutMs}ms`);
  }

  async runConversation(input: StartOpenHandsConversationInput): Promise<OpenHandsConversationResult> {
    const startTask = await this.startConversation(input);
    const ready = await this.waitUntilReady(startTask);
    const conversation = await this.waitForCompletion(ready.conversationId);

    return {
      startTaskId: startTask.id,
      conversationId: ready.conversationId,
      sandboxId: ready.sandboxId,
      executionStatus: conversation.execution_status || "finished",
      conversationUrl: this.getConversationUrl(ready.conversationId),
    };
  }

  async sendMessage(conversationId: string, instruction: string): Promise<void> {
    await this.request(`/api/v1/app-conversations/${encodeURIComponent(conversationId)}/send-message`, {
      method: "POST",
      body: JSON.stringify({
        content: [{ type: "text", text: instruction }],
        role: "user",
        run: true,
      }),
    });
  }

  async readFile(conversationId: string, filePath: string): Promise<string> {
    const result = await this.request<string>(
      `/api/v1/app-conversations/${encodeURIComponent(conversationId)}/file?file_path=${encodeURIComponent(filePath)}`,
      { method: "GET" }
    );
    return typeof result === "string" ? result : JSON.stringify(result);
  }

  async getGitChanges(conversationId: string, repoPath = "/workspace/project"): Promise<unknown> {
    return this.request<unknown>(
      `/api/v1/app-conversations/${encodeURIComponent(conversationId)}/git/changes?path=${encodeURIComponent(repoPath)}`,
      { method: "GET" }
    );
  }

  async getFileDiff(conversationId: string, filePath: string): Promise<string> {
    const result = await this.request<unknown>(
      `/api/v1/app-conversations/${encodeURIComponent(conversationId)}/git/diff?path=${encodeURIComponent(filePath)}`,
      { method: "GET" }
    );

    if (typeof result === "string") return result;
    if (result && typeof result === "object") {
      const objectResult = result as Record<string, unknown>;
      const candidate = objectResult.diff || objectResult.patch || objectResult.content;
      if (typeof candidate === "string") return candidate;
    }
    return JSON.stringify(result, null, 2);
  }
}
