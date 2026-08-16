import type { MemoryType } from "@/lib/supabase/types";

export interface ProjectMemoryEntry {
  id?: string;
  organizationId: string;
  projectId: string;
  environment?: string;
  memoryType: MemoryType;
  title: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface MemorySearchResult {
  entry: ProjectMemoryEntry;
  score: number;
}

export interface ProjectMemoryProvider {
  remember(entry: ProjectMemoryEntry): Promise<{ id: string }>;
  search(params: {
    organizationId: string;
    projectId: string;
    query: string;
    limit?: number;
    memoryTypes?: MemoryType[];
  }): Promise<MemorySearchResult[]>;
  getArchitectureContext(organizationId: string, projectId: string): Promise<string>;
}
