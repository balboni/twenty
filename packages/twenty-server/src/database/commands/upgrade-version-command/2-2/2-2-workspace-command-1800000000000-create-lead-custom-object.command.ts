import { Command } from 'nest-commander';
import { v4 } from 'uuid';

import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type CreateFieldInput } from 'src/engine/metadata-modules/field-metadata/dtos/create-field.input';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';

const LEAD_STATUS_OPTIONS = [
  { id: v4(), value: 'NEW', label: 'New', position: 0, color: 'green' },
  {
    id: v4(),
    value: 'WORKING',
    label: 'Working',
    position: 1,
    color: 'turquoise',
  },
  {
    id: v4(),
    value: 'ATTEMPTED_CONTACT',
    label: 'Attempted Contact',
    position: 2,
    color: 'sky',
  },
  {
    id: v4(),
    value: 'CONNECTED',
    label: 'Connected',
    position: 3,
    color: 'blue',
  },
  {
    id: v4(),
    value: 'QUALIFIED',
    label: 'Qualified',
    position: 4,
    color: 'purple',
  },
  {
    id: v4(),
    value: 'NURTURE',
    label: 'Nurture',
    position: 5,
    color: 'yellow',
  },
  {
    id: v4(),
    value: 'DISQUALIFIED',
    label: 'Disqualified',
    position: 6,
    color: 'red',
  },
  {
    id: v4(),
    value: 'CONVERTED',
    label: 'Converted',
    position: 7,
    color: 'orange',
  },
];

const LEAD_SOURCE_OPTIONS = [
  { id: v4(), value: 'WEBSITE', label: 'Website', position: 0, color: 'blue' },
  {
    id: v4(),
    value: 'LINKEDIN',
    label: 'LinkedIn',
    position: 1,
    color: 'sky',
  },
  {
    id: v4(),
    value: 'EMAIL_OUTREACH',
    label: 'Email Outreach',
    position: 2,
    color: 'turquoise',
  },
  {
    id: v4(),
    value: 'REFERRAL',
    label: 'Referral',
    position: 3,
    color: 'green',
  },
  {
    id: v4(),
    value: 'EVENT',
    label: 'Event',
    position: 4,
    color: 'purple',
  },
  {
    id: v4(),
    value: 'PARTNER',
    label: 'Partner',
    position: 5,
    color: 'pink',
  },
  {
    id: v4(),
    value: 'IMPORTED_LIST',
    label: 'Imported List',
    position: 6,
    color: 'orange',
  },
  {
    id: v4(),
    value: 'MANUAL',
    label: 'Manual',
    position: 7,
    color: 'yellow',
  },
  { id: v4(), value: 'OTHER', label: 'Other', position: 8, color: 'gray' },
];

const ICP_SEGMENT_OPTIONS = [
  {
    id: v4(),
    value: 'SALES_COACH',
    label: 'Sales Coach',
    position: 0,
    color: 'blue',
  },
  { id: v4(), value: 'CRO', label: 'CRO', position: 1, color: 'purple' },
  {
    id: v4(),
    value: 'SALES_LEADER',
    label: 'Sales Leader',
    position: 2,
    color: 'sky',
  },
  {
    id: v4(),
    value: 'FOUNDER',
    label: 'Founder',
    position: 3,
    color: 'green',
  },
  {
    id: v4(),
    value: 'REVOPS',
    label: 'RevOps',
    position: 4,
    color: 'turquoise',
  },
  {
    id: v4(),
    value: 'SAAS_EXECUTIVE',
    label: 'SaaS Executive',
    position: 5,
    color: 'orange',
  },
  { id: v4(), value: 'OTHER', label: 'Other', position: 6, color: 'gray' },
];

const BUYING_ROLE_OPTIONS = [
  {
    id: v4(),
    value: 'DECISION_MAKER',
    label: 'Decision Maker',
    position: 0,
    color: 'blue',
  },
  {
    id: v4(),
    value: 'INFLUENCER',
    label: 'Influencer',
    position: 1,
    color: 'purple',
  },
  { id: v4(), value: 'USER', label: 'User', position: 2, color: 'green' },
  {
    id: v4(),
    value: 'TECHNICAL_EVALUATOR',
    label: 'Technical Evaluator',
    position: 3,
    color: 'sky',
  },
  {
    id: v4(),
    value: 'PARTNER',
    label: 'Partner',
    position: 4,
    color: 'orange',
  },
  {
    id: v4(),
    value: 'UNKNOWN',
    label: 'Unknown',
    position: 5,
    color: 'gray',
  },
];

const PAIN_POINT_OPTIONS = [
  {
    id: v4(),
    value: 'LOW_CLOSE_RATE',
    label: 'Low close rate',
    position: 0,
    color: 'red',
  },
  {
    id: v4(),
    value: 'INCONSISTENT_SALES_PROCESS',
    label: 'Inconsistent sales process',
    position: 1,
    color: 'orange',
  },
  {
    id: v4(),
    value: 'WEAK_DISCOVERY',
    label: 'Weak discovery',
    position: 2,
    color: 'yellow',
  },
  {
    id: v4(),
    value: 'POOR_FOLLOW_UP',
    label: 'Poor follow-up',
    position: 3,
    color: 'blue',
  },
  {
    id: v4(),
    value: 'CRM_ADMIN_BURDEN',
    label: 'CRM admin burden',
    position: 4,
    color: 'purple',
  },
  {
    id: v4(),
    value: 'LIMITED_CALL_VISIBILITY',
    label: 'Limited call visibility',
    position: 5,
    color: 'sky',
  },
  {
    id: v4(),
    value: 'COACHING_INCONSISTENCY',
    label: 'Sales coaching inconsistency',
    position: 6,
    color: 'turquoise',
  },
  {
    id: v4(),
    value: 'POOR_PIPELINE_ACCURACY',
    label: 'Poor pipeline accuracy',
    position: 7,
    color: 'pink',
  },
];

const PRODUCT_INTEREST_OPTIONS = [
  {
    id: v4(),
    value: 'CLOSERATE_SALES_COACHING',
    label: 'CloseRate Sales Coaching',
    position: 0,
    color: 'blue',
  },
  { id: v4(), value: 'CRM', label: 'CRM', position: 1, color: 'green' },
  {
    id: v4(),
    value: 'AI_SALES_NOTES',
    label: 'AI Sales Notes',
    position: 2,
    color: 'purple',
  },
  {
    id: v4(),
    value: 'CALL_ANALYSIS',
    label: 'Call Analysis',
    position: 3,
    color: 'sky',
  },
  {
    id: v4(),
    value: 'PIPELINE_REPORTING',
    label: 'Pipeline Reporting',
    position: 4,
    color: 'turquoise',
  },
  {
    id: v4(),
    value: 'UNKNOWN',
    label: 'Unknown',
    position: 5,
    color: 'gray',
  },
];

const DISQUALIFICATION_REASON_OPTIONS = [
  {
    id: v4(),
    value: 'NOT_ICP',
    label: 'Not ICP',
    position: 0,
    color: 'red',
  },
  {
    id: v4(),
    value: 'NO_BUDGET',
    label: 'No budget',
    position: 1,
    color: 'orange',
  },
  {
    id: v4(),
    value: 'BAD_TIMING',
    label: 'Bad timing',
    position: 2,
    color: 'yellow',
  },
  {
    id: v4(),
    value: 'STUDENT_RESEARCH',
    label: 'Student/research',
    position: 3,
    color: 'sky',
  },
  {
    id: v4(),
    value: 'COMPETITOR',
    label: 'Competitor',
    position: 4,
    color: 'purple',
  },
  {
    id: v4(),
    value: 'UNRESPONSIVE',
    label: 'Unresponsive',
    position: 5,
    color: 'gray',
  },
  {
    id: v4(),
    value: 'DUPLICATE',
    label: 'Duplicate',
    position: 6,
    color: 'pink',
  },
  { id: v4(), value: 'OTHER', label: 'Other', position: 7, color: 'gray' },
];

@RegisteredWorkspaceCommand('2.2.0', 1800000000000)
@Command({
  name: 'upgrade:2-2:create-lead-custom-object',
  description: 'Create the Lead custom object with CloseRate fields',
})
export class CreateLeadCustomObjectCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    // Idempotency check
    const existingLead =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: 'lead' },
      });

    if (isDefined(existingLead)) {
      this.logger.log(
        `Lead object already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would create Lead object for workspace ${workspaceId}`,
      );

      return;
    }

    this.logger.log(`Creating Lead object for workspace ${workspaceId}`);

    // Create the Lead object (auto-creates id, name, createdAt, updatedAt, etc.)
    await this.objectMetadataService.createOneObject({
      createObjectInput: {
        nameSingular: 'lead',
        namePlural: 'leads',
        labelSingular: 'Lead',
        labelPlural: 'Leads',
        description: 'A sales lead',
        icon: 'IconUserPlus',
      },
      workspaceId,
    });

    // Look up the created object
    const leadObject = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: { nameSingular: 'lead' },
      },
    );

    if (!isDefined(leadObject)) {
      this.logger.error(
        `Failed to find Lead object after creation for workspace ${workspaceId}`,
      );

      return;
    }

    this.logger.log(
      `Lead object created with ID ${leadObject.id}, adding fields...`,
    );

    // Create non-relation fields
    const fieldDefinitions: Omit<CreateFieldInput, 'workspaceId'>[] = [
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.EMAILS,
        name: 'email',
        label: 'Email',
        description: 'Lead email address',
        icon: 'IconMail',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.TEXT,
        name: 'companyName',
        label: 'Company Name',
        description: 'Company or organization name',
        icon: 'IconBuildingSkyscraper',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.TEXT,
        name: 'jobTitle',
        label: 'Job Title',
        description: 'Job title or role',
        icon: 'IconBriefcase',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.PHONES,
        name: 'phone',
        label: 'Phone',
        description: 'Phone number',
        icon: 'IconPhone',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.LINKS,
        name: 'linkedinUrl',
        label: 'LinkedIn',
        description: 'LinkedIn profile URL',
        icon: 'IconBrandLinkedin',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.LINKS,
        name: 'websiteDomain',
        label: 'Website',
        description: 'Website or domain',
        icon: 'IconWorld',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.SELECT,
        name: 'leadStatus',
        label: 'Lead Status',
        description: 'Current status in the sales funnel',
        icon: 'IconProgressCheck',
        defaultValue: "'NEW'",
        options: LEAD_STATUS_OPTIONS,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.SELECT,
        name: 'leadSource',
        label: 'Lead Source',
        description: 'How the lead was acquired',
        icon: 'IconSource',
        options: LEAD_SOURCE_OPTIONS,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.TEXT,
        name: 'sourceDetail',
        label: 'Source Detail',
        description: 'Campaign name, list, or referral source',
        icon: 'IconFileDescription',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.SELECT,
        name: 'icpSegment',
        label: 'ICP Segment',
        description: 'Ideal customer profile segment',
        icon: 'IconTarget',
        options: ICP_SEGMENT_OPTIONS,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.SELECT,
        name: 'buyingRole',
        label: 'Buying Role',
        description: 'Role in the buying process',
        icon: 'IconUsers',
        options: BUYING_ROLE_OPTIONS,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.MULTI_SELECT,
        name: 'painPoint',
        label: 'Pain Points',
        description: 'Identified pain points',
        icon: 'IconAlertTriangle',
        options: PAIN_POINT_OPTIONS,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.SELECT,
        name: 'productInterest',
        label: 'Product Interest',
        description: 'Product or feature interest',
        icon: 'IconPackage',
        options: PRODUCT_INTEREST_OPTIONS,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.NUMBER,
        name: 'qualificationScore',
        label: 'Qualification Score',
        description: 'Lead qualification score (0-100)',
        icon: 'IconChartBar',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.SELECT,
        name: 'disqualificationReason',
        label: 'Disqualification Reason',
        description: 'Reason for disqualification',
        icon: 'IconX',
        options: DISQUALIFICATION_REASON_OPTIONS,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.DATE_TIME,
        name: 'lastContactedDate',
        label: 'Last Contacted',
        description: 'Date of last contact',
        icon: 'IconCalendarEvent',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.DATE_TIME,
        name: 'nextFollowUpDate',
        label: 'Next Follow-Up',
        description: 'Next scheduled follow-up date',
        icon: 'IconCalendarDue',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.TEXT,
        name: 'nextStep',
        label: 'Next Step',
        description: 'Short operational next action',
        icon: 'IconArrowRight',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.BOOLEAN,
        name: 'converted',
        label: 'Converted',
        description: 'Whether the lead has been converted',
        icon: 'IconCheck',
        defaultValue: false,
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.DATE_TIME,
        name: 'convertedDate',
        label: 'Converted Date',
        description: 'Date the lead was converted',
        icon: 'IconCalendarCheck',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.TEXT,
        name: 'convertedContactId',
        label: 'Converted Contact ID',
        description: 'ID of the contact created from this lead',
        icon: 'IconUser',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.TEXT,
        name: 'convertedCompanyId',
        label: 'Converted Company ID',
        description: 'ID of the company created from this lead',
        icon: 'IconBuilding',
      },
      {
        objectMetadataId: leadObject.id,
        type: FieldMetadataType.TEXT,
        name: 'convertedOpportunityId',
        label: 'Converted Opportunity ID',
        description: 'ID of the opportunity created from this lead',
        icon: 'IconTargetArrow',
      },
    ];

    await this.fieldMetadataService.createManyFields({
      createFieldInputs: fieldDefinitions,
      workspaceId,
    });

    this.logger.log(`Created ${fieldDefinitions.length} fields on Lead object`);

    // Create the Owner relation field (MANY_TO_ONE → workspaceMember)
    const workspaceMemberObject =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: 'workspaceMember' },
      });

    if (!isDefined(workspaceMemberObject)) {
      this.logger.warn(
        `workspaceMember object not found for workspace ${workspaceId}, skipping Owner relation`,
      );

      return;
    }

    await this.fieldMetadataService.createManyFields({
      createFieldInputs: [
        {
          objectMetadataId: leadObject.id,
          type: FieldMetadataType.RELATION,
          name: 'owner',
          label: 'Owner',
          description: 'Assigned sales rep or account owner',
          icon: 'IconUserCircle',
          relationCreationPayload: {
            type: RelationType.MANY_TO_ONE,
            targetObjectMetadataId: workspaceMemberObject.id,
            targetFieldLabel: 'Leads',
            targetFieldIcon: 'IconUserPlus',
          },
        },
      ],
      workspaceId,
    });

    this.logger.log(
      `Created Owner relation field. Lead object setup complete for workspace ${workspaceId}`,
    );
  }
}
