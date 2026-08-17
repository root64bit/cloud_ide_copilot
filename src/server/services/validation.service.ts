import { AuditLogger } from "@/lib/audit/logger";
import type { CommandType } from "@/lib/supabase/types";
import type { SandboxProvider } from "../providers/sandbox/sandbox.interface";
import { AuthGuard } from "../rbac/guard";
import { WorkspaceService } from "./workspace.service";

export interface ValidationPipelineResult {
  allPassed: boolean;
  stepResults: Array<{
    step: CommandType;
    passed: boolean;
    exitCode: number | null;
    output: string;
  }>;
}

export class ValidationService {
  /**
   * Executes the full automated validation gate inside the sandbox:
   * 1. install
   * 2. test
   * 3. lint
   * 4. typecheck
   * 5. build
   */
  public static async runValidationPipeline(
    userId: string,
    organizationId: string,
    workspaceId: string,
    sandboxProvider: SandboxProvider
  ): Promise<ValidationPipelineResult> {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:validate");
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "validating");

    const steps: CommandType[] = ["install", "test", "lint", "typecheck", "build"];
    const stepResults: ValidationPipelineResult["stepResults"] = [];
    let allPassed = true;

    for (const step of steps) {
      try {
        const cmdRun = await WorkspaceService.executeCommand(
          userId,
          organizationId,
          workspaceId,
          sandboxProvider,
          step
        );

        const passed = cmdRun.exit_code === 0;
        stepResults.push({
          step,
          passed,
          exitCode: cmdRun.exit_code ?? (passed ? 0 : 1),
          output: cmdRun.stdout_excerpt || cmdRun.stderr_excerpt || "",
        });

        if (!passed) {
          allPassed = false;
          break; // Stop pipeline on first failure
        }
      } catch (err: any) {
        allPassed = false;
        stepResults.push({
          step,
          passed: false,
          exitCode: 1,
          output: err?.message || "Validation step failed execution",
        });
        break;
      }
    }

    if (allPassed) {
      await WorkspaceService.updateStatus(
        userId,
        organizationId,
        workspaceId,
        "ready_for_review",
        { validationPassed: true }
      );
    } else {
      await WorkspaceService.updateStatus(
        userId,
        organizationId,
        workspaceId,
        "validation_failed",
        { validationPassed: false }
      );
    }

    await AuditLogger.log({
      organizationId,
      workspaceId,
      userId,
      eventType: "workspace.validation_pipeline_completed",
      metadata: { allPassed, stepsExecuted: stepResults.length },
    });

    return { allPassed, stepResults };
  }
}
