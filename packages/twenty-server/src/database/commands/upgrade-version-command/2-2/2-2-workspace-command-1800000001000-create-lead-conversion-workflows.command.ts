import { Command } from 'nest-commander';

import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { CommandMenuItemAvailabilityType } from 'src/engine/metadata-modules/command-menu-item/enums/command-menu-item-availability-type.enum';
import { EngineComponentKey } from 'src/engine/metadata-modules/command-menu-item/enums/engine-component-key.enum';
import { CommandMenuItemService } from 'src/engine/metadata-modules/command-menu-item/command-menu-item.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

// Workflow IDs
export const CONVERT_LEAD_TO_CONTACT_WORKFLOW_ID =
  'a1b2c3d4-1001-4000-8000-000000000001';
export const CONVERT_LEAD_TO_CONTACT_WORKFLOW_VERSION_ID =
  'a1b2c3d4-1001-4000-8000-000000000011';

export const CONVERT_LEAD_TO_COMPANY_WORKFLOW_ID =
  'a1b2c3d4-1002-4000-8000-000000000002';
export const CONVERT_LEAD_TO_COMPANY_WORKFLOW_VERSION_ID =
  'a1b2c3d4-1002-4000-8000-000000000022';

export const CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_ID =
  'a1b2c3d4-1003-4000-8000-000000000003';
export const CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_VERSION_ID =
  'a1b2c3d4-1003-4000-8000-000000000033';

// Step IDs
const CREATE_PERSON_STEP_ID = 'b2c3d4e5-2001-4000-8000-000000000001';
const UPDATE_LEAD_AFTER_CONTACT_STEP_ID =
  'b2c3d4e5-2001-4000-8000-000000000002';

const CREATE_COMPANY_STEP_ID = 'b2c3d4e5-2002-4000-8000-000000000001';
const UPDATE_LEAD_AFTER_COMPANY_STEP_ID =
  'b2c3d4e5-2002-4000-8000-000000000002';

const CREATE_OPPORTUNITY_STEP_ID = 'b2c3d4e5-2003-4000-8000-000000000001';
const UPDATE_LEAD_AFTER_OPPORTUNITY_STEP_ID =
  'b2c3d4e5-2003-4000-8000-000000000002';

const buildConvertToContactSteps = () => [
  {
    id: CREATE_PERSON_STEP_ID,
    name: 'Create Contact from Lead',
    type: 'CREATE_RECORD',
    valid: true,
    settings: {
      input: {
        objectName: 'person',
        objectRecord: {
          name: {
            firstName: '',
            lastName: '{{trigger.name}}',
          },
          emails: {
            primaryEmail: '{{trigger.email.primaryEmail}}',
            additionalEmails: [],
          },
          phones: {
            primaryPhoneNumber: '{{trigger.phone.primaryPhoneNumber}}',
            primaryPhoneCountryCode:
              '{{trigger.phone.primaryPhoneCountryCode}}',
            additionalPhones: [],
          },
          jobTitle: '{{trigger.jobTitle}}',
          linkedinLink: {
            primaryLinkUrl: '{{trigger.linkedinUrl.primaryLinkUrl}}',
            primaryLinkLabel: '{{trigger.name}}',
          },
        },
      },
      outputSchema: {},
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
    __typename: 'WorkflowAction',
    nextStepIds: [UPDATE_LEAD_AFTER_CONTACT_STEP_ID],
  },
  {
    id: UPDATE_LEAD_AFTER_CONTACT_STEP_ID,
    name: 'Mark Lead as Converted',
    type: 'UPDATE_RECORD',
    valid: true,
    settings: {
      input: {
        objectName: 'lead',
        objectRecordId: '{{trigger.id}}',
        objectRecord: {
          leadStatus: 'CONVERTED',
          converted: true,
          convertedContactId: `{{${CREATE_PERSON_STEP_ID}.id}}`,
        },
        fieldsToUpdate: ['leadStatus', 'converted', 'convertedContactId'],
      },
      outputSchema: {},
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
    __typename: 'WorkflowAction',
    nextStepIds: null,
  },
];

const buildConvertToCompanySteps = () => [
  {
    id: CREATE_COMPANY_STEP_ID,
    name: 'Create Company from Lead',
    type: 'CREATE_RECORD',
    valid: true,
    settings: {
      input: {
        objectName: 'company',
        objectRecord: {
          name: '{{trigger.companyName}}',
          domainName: {
            primaryLinkUrl: '{{trigger.websiteDomain.primaryLinkUrl}}',
            primaryLinkLabel: '{{trigger.companyName}}',
          },
          linkedinLink: {
            primaryLinkUrl: '{{trigger.linkedinUrl.primaryLinkUrl}}',
            primaryLinkLabel: '{{trigger.companyName}}',
          },
        },
      },
      outputSchema: {},
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
    __typename: 'WorkflowAction',
    nextStepIds: [UPDATE_LEAD_AFTER_COMPANY_STEP_ID],
  },
  {
    id: UPDATE_LEAD_AFTER_COMPANY_STEP_ID,
    name: 'Mark Lead as Converted',
    type: 'UPDATE_RECORD',
    valid: true,
    settings: {
      input: {
        objectName: 'lead',
        objectRecordId: '{{trigger.id}}',
        objectRecord: {
          leadStatus: 'CONVERTED',
          converted: true,
          convertedCompanyId: `{{${CREATE_COMPANY_STEP_ID}.id}}`,
        },
        fieldsToUpdate: ['leadStatus', 'converted', 'convertedCompanyId'],
      },
      outputSchema: {},
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
    __typename: 'WorkflowAction',
    nextStepIds: null,
  },
];

const buildConvertToOpportunitySteps = () => [
  {
    id: CREATE_OPPORTUNITY_STEP_ID,
    name: 'Create Opportunity from Lead',
    type: 'CREATE_RECORD',
    valid: true,
    settings: {
      input: {
        objectName: 'opportunity',
        objectRecord: {
          name: '{{trigger.name}}',
        },
      },
      outputSchema: {},
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
    __typename: 'WorkflowAction',
    nextStepIds: [UPDATE_LEAD_AFTER_OPPORTUNITY_STEP_ID],
  },
  {
    id: UPDATE_LEAD_AFTER_OPPORTUNITY_STEP_ID,
    name: 'Mark Lead as Converted',
    type: 'UPDATE_RECORD',
    valid: true,
    settings: {
      input: {
        objectName: 'lead',
        objectRecordId: '{{trigger.id}}',
        objectRecord: {
          leadStatus: 'CONVERTED',
          converted: true,
          convertedOpportunityId: `{{${CREATE_OPPORTUNITY_STEP_ID}.id}}`,
        },
        fieldsToUpdate: ['leadStatus', 'converted', 'convertedOpportunityId'],
      },
      outputSchema: {},
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
    __typename: 'WorkflowAction',
    nextStepIds: null,
  },
];

const buildManualLeadTrigger = (
  label: string,
  icon: string,
  firstStepId: string,
) => ({
  name: label,
  type: 'MANUAL',
  settings: {
    outputSchema: {},
    icon,
    availability: {
      type: 'SINGLE_RECORD',
      objectNameSingular: 'lead',
    },
  },
  nextStepIds: [firstStepId],
});

@RegisteredWorkspaceCommand('2.2.0', 1800000001000)
@Command({
  name: 'upgrade:2-2:create-lead-conversion-workflows',
  description:
    'Create workflows for converting leads to contacts, companies, and opportunities',
})
export class CreateLeadConversionWorkflowsCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly commandMenuItemService: CommandMenuItemService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    // Check that the lead object exists
    const leadObject = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: { nameSingular: 'lead' },
      },
    );

    if (!isDefined(leadObject)) {
      this.logger.log(
        `Lead object not found for workspace ${workspaceId}, skipping conversion workflows`,
      );

      return;
    }

    // Idempotency: check if workflows already exist
    const authContext = buildSystemAuthContext(workspaceId);

    const workflowExists =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const workflowRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              workspaceId,
              'workflow',
              { shouldBypassPermissionChecks: true },
            );

          const existing = await workflowRepository.findOne({
            where: { id: CONVERT_LEAD_TO_CONTACT_WORKFLOW_ID },
          });

          return isDefined(existing);
        },
        authContext,
      );

    if (workflowExists) {
      this.logger.log(
        `Lead conversion workflows already exist for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would create lead conversion workflows for workspace ${workspaceId}`,
      );

      return;
    }

    this.logger.log(
      `Creating lead conversion workflows for workspace ${workspaceId}`,
    );

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      await this.createWorkflowsAndVersions(workspaceId);
    }, authContext);

    await this.createCommandMenuItems(workspaceId, leadObject.id);

    this.logger.log(
      `Lead conversion workflows created for workspace ${workspaceId}`,
    );
  }

  private async createWorkflowsAndVersions(workspaceId: string): Promise<void> {
    const workflowRepository =
      await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        'workflow',
        { shouldBypassPermissionChecks: true },
      );

    const workflowVersionRepository =
      await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        'workflowVersion',
        { shouldBypassPermissionChecks: true },
      );

    const workflowBase = {
      statuses: ['ACTIVE'],
      createdBySource: FieldActorSource.SYSTEM,
      createdByWorkspaceMemberId: null,
      createdByName: 'System',
      createdByContext: {},
      updatedBySource: FieldActorSource.SYSTEM,
      updatedByWorkspaceMemberId: null,
      updatedByName: 'System',
    };

    // Create workflows
    await workflowRepository.insert([
      {
        id: CONVERT_LEAD_TO_CONTACT_WORKFLOW_ID,
        name: 'Convert Lead to Contact',
        lastPublishedVersionId: CONVERT_LEAD_TO_CONTACT_WORKFLOW_VERSION_ID,
        position: 10,
        ...workflowBase,
      },
      {
        id: CONVERT_LEAD_TO_COMPANY_WORKFLOW_ID,
        name: 'Convert Lead to Company',
        lastPublishedVersionId: CONVERT_LEAD_TO_COMPANY_WORKFLOW_VERSION_ID,
        position: 11,
        ...workflowBase,
      },
      {
        id: CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_ID,
        name: 'Convert Lead to Opportunity',
        lastPublishedVersionId: CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_VERSION_ID,
        position: 12,
        ...workflowBase,
      },
    ]);

    // Create workflow versions
    await workflowVersionRepository.insert([
      {
        id: CONVERT_LEAD_TO_CONTACT_WORKFLOW_VERSION_ID,
        name: 'v1',
        trigger: buildManualLeadTrigger(
          'Convert to Contact',
          'IconUserPlus',
          CREATE_PERSON_STEP_ID,
        ),
        steps: buildConvertToContactSteps(),
        status: 'ACTIVE',
        position: 1,
        workflowId: CONVERT_LEAD_TO_CONTACT_WORKFLOW_ID,
      },
      {
        id: CONVERT_LEAD_TO_COMPANY_WORKFLOW_VERSION_ID,
        name: 'v1',
        trigger: buildManualLeadTrigger(
          'Convert to Company',
          'IconBuildingSkyscraper',
          CREATE_COMPANY_STEP_ID,
        ),
        steps: buildConvertToCompanySteps(),
        status: 'ACTIVE',
        position: 1,
        workflowId: CONVERT_LEAD_TO_COMPANY_WORKFLOW_ID,
      },
      {
        id: CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_VERSION_ID,
        name: 'v1',
        trigger: buildManualLeadTrigger(
          'Convert to Opportunity',
          'IconTargetArrow',
          CREATE_OPPORTUNITY_STEP_ID,
        ),
        steps: buildConvertToOpportunitySteps(),
        status: 'ACTIVE',
        position: 1,
        workflowId: CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_ID,
      },
    ]);
  }

  private async createCommandMenuItems(
    workspaceId: string,
    leadObjectMetadataId: string,
  ): Promise<void> {
    const commandMenuItems = [
      {
        workflowVersionId: CONVERT_LEAD_TO_CONTACT_WORKFLOW_VERSION_ID,
        engineComponentKey: EngineComponentKey.TRIGGER_WORKFLOW_VERSION,
        label: 'Convert to Contact',
        shortLabel: 'Convert to Contact',
        icon: 'IconUserPlus',
        isPinned: true,
        availabilityType: CommandMenuItemAvailabilityType.RECORD_SELECTION,
        availabilityObjectMetadataId: leadObjectMetadataId,
      },
      {
        workflowVersionId: CONVERT_LEAD_TO_COMPANY_WORKFLOW_VERSION_ID,
        engineComponentKey: EngineComponentKey.TRIGGER_WORKFLOW_VERSION,
        label: 'Convert to Company',
        shortLabel: 'Convert to Company',
        icon: 'IconBuildingSkyscraper',
        isPinned: true,
        availabilityType: CommandMenuItemAvailabilityType.RECORD_SELECTION,
        availabilityObjectMetadataId: leadObjectMetadataId,
      },
      {
        workflowVersionId: CONVERT_LEAD_TO_OPPORTUNITY_WORKFLOW_VERSION_ID,
        engineComponentKey: EngineComponentKey.TRIGGER_WORKFLOW_VERSION,
        label: 'Convert to Opportunity',
        shortLabel: 'Convert to Opportunity',
        icon: 'IconTargetArrow',
        isPinned: true,
        availabilityType: CommandMenuItemAvailabilityType.RECORD_SELECTION,
        availabilityObjectMetadataId: leadObjectMetadataId,
      },
    ];

    for (const item of commandMenuItems) {
      try {
        await this.commandMenuItemService.create(item, workspaceId);
      } catch (error) {
        this.logger.warn(
          `Failed to create command menu item "${item.label}" for workspace ${workspaceId}: ${error.message}`,
        );
      }
    }
  }
}
