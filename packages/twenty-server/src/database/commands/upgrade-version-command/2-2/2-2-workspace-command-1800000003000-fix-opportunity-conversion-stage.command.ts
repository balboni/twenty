import { Command } from 'nest-commander';

import { isDefined } from 'twenty-shared/utils';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_VERSION_ID } from 'src/database/commands/upgrade-version-command/2-2/2-2-workspace-command-1800000001000-create-lead-conversion-workflows.command';

@RegisteredWorkspaceCommand('2.2.0', 1800000003000)
@Command({
  name: 'upgrade:2-2:fix-opportunity-conversion-stage',
  description:
    'Fix the Convert to Opportunity workflow to include the required stage field',
})
export class FixOpportunityConversionStageCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const workflowVersionRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'workflowVersion',
          { shouldBypassPermissionChecks: true },
        );

      const workflowVersion = await workflowVersionRepository.findOne({
        where: { id: CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_VERSION_ID },
      });

      if (!isDefined(workflowVersion)) {
        this.logger.log(
          `Convert to Opportunity workflow not found for workspace ${workspaceId}, skipping`,
        );

        return;
      }

      const steps = workflowVersion.steps as Array<{
        id: string;
        type: string;
        settings: {
          input: {
            objectName: string;
            objectRecord: Record<string, unknown>;
          };
        };
      }>;

      const createStep = steps.find(
        (step) =>
          step.type === 'CREATE_RECORD' &&
          step.settings?.input?.objectName === 'opportunity',
      );

      if (!isDefined(createStep)) {
        this.logger.log(
          `CREATE_RECORD step for opportunity not found in workspace ${workspaceId}, skipping`,
        );

        return;
      }

      if (isDefined(createStep.settings.input.objectRecord.stage)) {
        this.logger.log(
          `Stage already set in opportunity conversion for workspace ${workspaceId}, skipping`,
        );

        return;
      }

      if (isDryRun) {
        this.logger.log(
          `[DRY RUN] Would add stage field to opportunity conversion for workspace ${workspaceId}`,
        );

        return;
      }

      createStep.settings.input.objectRecord.stage = 'NEW';

      await workflowVersionRepository.update(
        { id: CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_VERSION_ID },
        { steps },
      );

      this.logger.log(
        `Fixed opportunity conversion stage for workspace ${workspaceId}`,
      );
    }, authContext);
  }
}
