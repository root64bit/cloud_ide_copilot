import { InMemoryDatabase } from "@/lib/supabase/server";
import type {
  MemorySearchResult,
  ProjectMemoryEntry,
  ProjectMemoryProvider,
} from "./memory.interface";

export class DatabaseMemoryProvider implements ProjectMemoryProvider {
  async remember(entry: ProjectMemoryEntry): Promise<{ id: string }> {
    const id = entry.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      ...entry,
      id,
      environment: entry.environment || "production",
      tags: entry.tags || [],
      metadata: entry.metadata || {},
      created_at: new Date().toISOString(),
    };

    InMemoryDatabase.getInstance().memories.set(id, record);
    return { id };
  }

  async search(params: {
    organizationId: string;
    projectId: string;
    query: string;
    limit?: number;
    memoryTypes?: string[];
  }): Promise<MemorySearchResult[]> {
    const allMemories = Array.from(InMemoryDatabase.getInstance().memories.values());
    const lowerQuery = params.query.toLowerCase();

    const filtered = allMemories.filter((m) => {
      if (m.organizationId !== params.organizationId) return false;
      if (m.projectId !== params.projectId) return false;
      if (params.memoryTypes && !params.memoryTypes.includes(m.memoryType)) return false;

      return (
        m.title.toLowerCase().includes(lowerQuery) ||
        m.content.toLowerCase().includes(lowerQuery) ||
        (m.tags && m.tags.some((t: string) => t.toLowerCase().includes(lowerQuery)))
      );
    });

    const limit = params.limit || 5;
    return filtered.slice(0, limit).map((m) => ({
      entry: m,
      score: 0.9,
    }));
  }

  async getArchitectureContext(organizationId: string, projectId: string): Promise<string> {
    const memories = await this.search({
      organizationId,
      projectId,
      query: "",
      memoryTypes: ["architecture", "convention", "database_contract"],
      limit: 10,
    });

    if (memories.length === 0) {
      return "Next.js App Router, TypeScript strict, Supabase PostgreSQL, Tailwind CSS.";
    }

    return memories.map((m) => `### ${m.entry.title}\n${m.entry.content}`).join("\n\n");
  }
}
