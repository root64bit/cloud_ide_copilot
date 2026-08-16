export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "admin" | "engineer" | "viewer";

export type ProjectStatus = "active" | "archived" | "paused";

export type IncidentStatus =
  | "unresolved"
  | "investigating"
  | "repairing"
  | "resolved"
  | "ignored";

export type IncidentLevel = "fatal" | "error" | "warning" | "info";

export type WorkspaceStatus =
  | "creating"
  | "cloning"
  | "ready"
  | "analyzing"
  | "repairing"
  | "validating"
  | "validation_failed"
  | "ready_for_review"
  | "pr_created"
  | "preview_building"
  | "preview_ready"
  | "approved"
  | "rejected"
  | "merged"
  | "completed"
  | "failed"
  | "stopped"
  | "expired";

export type CommandType =
  | "install"
  | "test"
  | "lint"
  | "typecheck"
  | "build"
  | "git_status"
  | "git_diff"
  | "dev"
  | "custom_allowlisted";

export type CommandRunStatus = "pending" | "running" | "passed" | "failed";

export type DeploymentEnvironment = "production" | "preview" | "staging";
export type DeploymentStatus = "building" | "ready" | "error" | "canceled";

export type MemoryType =
  | "architecture"
  | "convention"
  | "database_contract"
  | "past_repair"
  | "skill"
  | "deployment_rule";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          repository_provider: string;
          repository_owner: string;
          repository_name: string;
          repository_id: number | null;
          default_branch: string;
          deployment_provider: string;
          vercel_project_id: string | null;
          vercel_team_id: string | null;
          production_domain: string | null;
          package_manager: string;
          install_command: string;
          test_command: string;
          lint_command: string;
          typecheck_command: string;
          build_command: string;
          dev_command: string;
          dev_port: number;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          repository_provider?: string;
          repository_owner: string;
          repository_name: string;
          repository_id?: number | null;
          default_branch?: string;
          deployment_provider?: string;
          vercel_project_id?: string | null;
          vercel_team_id?: string | null;
          production_domain?: string | null;
          package_manager?: string;
          install_command?: string;
          test_command?: string;
          lint_command?: string;
          typecheck_command?: string;
          build_command?: string;
          dev_command?: string;
          dev_port?: number;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          repository_provider?: string;
          repository_owner?: string;
          repository_name?: string;
          repository_id?: number | null;
          default_branch?: string;
          deployment_provider?: string;
          vercel_project_id?: string | null;
          vercel_team_id?: string | null;
          production_domain?: string | null;
          package_manager?: string;
          install_command?: string;
          test_command?: string;
          lint_command?: string;
          typecheck_command?: string;
          build_command?: string;
          dev_command?: string;
          dev_port?: number;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      incidents: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          provider: string;
          external_issue_id: string;
          external_event_id: string | null;
          title: string;
          level: IncidentLevel;
          environment: string;
          release: string | null;
          commit_sha: string | null;
          culprit: string | null;
          status: IncidentStatus;
          first_seen_at: string;
          last_seen_at: string;
          occurrence_count: number;
          sanitized_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          provider?: string;
          external_issue_id: string;
          external_event_id?: string | null;
          title: string;
          level?: IncidentLevel;
          environment?: string;
          release?: string | null;
          commit_sha?: string | null;
          culprit?: string | null;
          status?: IncidentStatus;
          first_seen_at?: string;
          last_seen_at?: string;
          occurrence_count?: number;
          sanitized_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          provider?: string;
          external_issue_id?: string;
          external_event_id?: string | null;
          title?: string;
          level?: IncidentLevel;
          environment?: string;
          release?: string | null;
          commit_sha?: string | null;
          culprit?: string | null;
          status?: IncidentStatus;
          first_seen_at?: string;
          last_seen_at?: string;
          occurrence_count?: number;
          sanitized_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      repair_workspaces: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          incident_id: string | null;
          sandbox_provider: string;
          sandbox_id: string | null;
          sandbox_name: string;
          base_commit_sha: string;
          repair_branch: string;
          status: WorkspaceStatus;
          created_by: string;
          created_at: string;
          last_activity_at: string;
          expires_at: string;
          stopped_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          incident_id?: string | null;
          sandbox_provider?: string;
          sandbox_id?: string | null;
          sandbox_name: string;
          base_commit_sha: string;
          repair_branch: string;
          status?: WorkspaceStatus;
          created_by: string;
          created_at?: string;
          last_activity_at?: string;
          expires_at: string;
          stopped_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          incident_id?: string | null;
          sandbox_provider?: string;
          sandbox_id?: string | null;
          sandbox_name?: string;
          base_commit_sha?: string;
          repair_branch?: string;
          status?: WorkspaceStatus;
          created_by?: string;
          created_at?: string;
          last_activity_at?: string;
          expires_at?: string;
          stopped_at?: string | null;
        };
      };
      ai_analyses: {
        Row: {
          id: string;
          workspace_id: string | null;
          incident_id: string | null;
          provider: string;
          model: string;
          analysis_type: string;
          structured_result: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          incident_id?: string | null;
          provider?: string;
          model: string;
          analysis_type: string;
          structured_result?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          incident_id?: string | null;
          provider?: string;
          model?: string;
          analysis_type?: string;
          structured_result?: Json;
          created_by?: string | null;
          created_at?: string;
        };
      };
      command_runs: {
        Row: {
          id: string;
          workspace_id: string;
          command_type: CommandType;
          command_display: string;
          status: CommandRunStatus;
          exit_code: number | null;
          stdout_excerpt: string | null;
          stderr_excerpt: string | null;
          started_at: string;
          completed_at: string | null;
          triggered_by: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          command_type: CommandType;
          command_display: string;
          status?: CommandRunStatus;
          exit_code?: number | null;
          stdout_excerpt?: string | null;
          stderr_excerpt?: string | null;
          started_at?: string;
          completed_at?: string | null;
          triggered_by: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          command_type?: CommandType;
          command_display?: string;
          status?: CommandRunStatus;
          exit_code?: number | null;
          stdout_excerpt?: string | null;
          stderr_excerpt?: string | null;
          started_at?: string;
          completed_at?: string | null;
          triggered_by?: string;
        };
      };
      pull_requests: {
        Row: {
          id: string;
          workspace_id: string;
          provider: string;
          repository_id: number | null;
          external_pr_id: string | null;
          number: number;
          url: string;
          branch: string;
          base_branch: string;
          status: "open" | "merged" | "closed";
          created_at: string;
          merged_at: string | null;
          merged_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          provider?: string;
          repository_id?: number | null;
          external_pr_id?: string | null;
          number: number;
          url: string;
          branch: string;
          base_branch?: string;
          status?: "open" | "merged" | "closed";
          created_at?: string;
          merged_at?: string | null;
          merged_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          provider?: string;
          repository_id?: number | null;
          external_pr_id?: string | null;
          number?: number;
          url?: string;
          branch?: string;
          base_branch?: string;
          status?: "open" | "merged" | "closed";
          created_at?: string;
          merged_at?: string | null;
          merged_by?: string | null;
        };
      };
      deployments: {
        Row: {
          id: string;
          project_id: string;
          workspace_id: string | null;
          provider: string;
          external_deployment_id: string;
          environment: DeploymentEnvironment;
          branch: string;
          commit_sha: string;
          url: string;
          status: DeploymentStatus;
          created_at: string;
          ready_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          workspace_id?: string | null;
          provider?: string;
          external_deployment_id: string;
          environment?: DeploymentEnvironment;
          branch: string;
          commit_sha: string;
          url: string;
          status?: DeploymentStatus;
          created_at?: string;
          ready_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          workspace_id?: string | null;
          provider?: string;
          external_deployment_id?: string;
          environment?: DeploymentEnvironment;
          branch?: string;
          commit_sha?: string;
          url?: string;
          status?: DeploymentStatus;
          created_at?: string;
          ready_at?: string | null;
        };
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string | null;
          workspace_id: string | null;
          user_id: string | null;
          event_type: string;
          metadata: Json;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id?: string | null;
          workspace_id?: string | null;
          user_id?: string | null;
          event_type: string;
          metadata?: Json;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string | null;
          workspace_id?: string | null;
          user_id?: string | null;
          event_type?: string;
          metadata?: Json;
          ip_hash?: string | null;
          created_at?: string;
        };
      };
      project_memories: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          environment: string;
          memory_type: MemoryType;
          title: string;
          content: string;
          tags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          environment?: string;
          memory_type: MemoryType;
          title: string;
          content: string;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          environment?: string;
          memory_type?: MemoryType;
          title?: string;
          content?: string;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
