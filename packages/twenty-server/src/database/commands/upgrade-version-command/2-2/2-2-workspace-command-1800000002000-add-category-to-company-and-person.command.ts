import { Command } from 'nest-commander';

import { InjectRepository } from '@nestjs/typeorm';

import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';

const COMPANY_CATEGORY_OPTIONS = [
  {
    id: 'a3b4c5d6-1101-4001-8001-000000000001',
    value: 'CLIENT',
    label: 'Client',
    position: 0,
    color: 'green',
  },
  {
    id: 'a3b4c5d6-1101-4001-8001-000000000002',
    value: 'PARTNER',
    label: 'Partner',
    position: 1,
    color: 'blue',
  },
  {
    id: 'a3b4c5d6-1101-4001-8001-000000000003',
    value: 'PROSPECT',
    label: 'Prospect',
    position: 2,
    color: 'orange',
  },
  {
    id: 'a3b4c5d6-1101-4001-8001-000000000004',
    value: 'NETWORK',
    label: 'Network',
    position: 3,
    color: 'purple',
  },
  {
    id: 'a3b4c5d6-1101-4001-8001-000000000005',
    value: 'BLANK',
    label: 'Blank',
    position: 4,
    color: 'gray',
  },
];

const PERSON_CATEGORY_OPTIONS = [
  {
    id: 'a3b4c5d6-1201-4002-8002-000000000001',
    value: 'CLIENT',
    label: 'Client',
    position: 0,
    color: 'green',
  },
  {
    id: 'a3b4c5d6-1201-4002-8002-000000000002',
    value: 'PARTNER',
    label: 'Partner',
    position: 1,
    color: 'blue',
  },
  {
    id: 'a3b4c5d6-1201-4002-8002-000000000003',
    value: 'PROSPECT',
    label: 'Prospect',
    position: 2,
    color: 'orange',
  },
  {
    id: 'a3b4c5d6-1201-4002-8002-000000000004',
    value: 'NETWORK',
    label: 'Network',
    position: 3,
    color: 'purple',
  },
  {
    id: 'a3b4c5d6-1201-4002-8002-000000000005',
    value: 'PERSONAL',
    label: 'Personal',
    position: 4,
    color: 'sky',
  },
  {
    id: 'a3b4c5d6-1201-4002-8002-000000000006',
    value: 'EDUCATION',
    label: 'Education',
    position: 5,
    color: 'turquoise',
  },
  {
    id: 'a3b4c5d6-1201-4002-8002-000000000007',
    value: 'BLANK',
    label: 'Blank',
    position: 6,
    color: 'gray',
  },
];

@RegisteredWorkspaceCommand('2.2.0', 1800000002000)
@Command({
  name: 'upgrade:2-2:add-category-to-company-and-person',
  description: 'Add category SELECT field to Company and Person objects',
})
export class AddCategoryToCompanyAndPersonCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    @InjectRepository(FieldMetadataEntity)
    private readonly fieldMetadataRepository: Repository<FieldMetadataEntity>,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    await this.addCategoryField({
      workspaceId,
      isDryRun,
      objectName: 'company',
      options: COMPANY_CATEGORY_OPTIONS,
    });

    await this.addCategoryField({
      workspaceId,
      isDryRun,
      objectName: 'person',
      options: PERSON_CATEGORY_OPTIONS,
    });
  }

  private async addCategoryField({
    workspaceId,
    isDryRun,
    objectName,
    options,
  }: {
    workspaceId: string;
    isDryRun: boolean;
    objectName: string;
    options: Array<{
      id: string;
      value: string;
      label: string;
      position: number;
      color: string;
    }>;
  }): Promise<void> {
    const objectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: objectName },
      });

    if (!isDefined(objectMetadata)) {
      this.logger.warn(
        `${objectName} object not found for workspace ${workspaceId}, skipping category field`,
      );

      return;
    }

    // Check if category field already exists
    const existingField = await this.fieldMetadataRepository.findOne({
      where: {
        objectMetadataId: objectMetadata.id,
        name: 'category',
        workspaceId,
      },
    });

    if (isDefined(existingField)) {
      this.logger.log(
        `Category field already exists on ${objectName} for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would add category field to ${objectName} for workspace ${workspaceId}`,
      );

      return;
    }

    await this.fieldMetadataService.createManyFields({
      createFieldInputs: [
        {
          objectMetadataId: objectMetadata.id,
          type: FieldMetadataType.SELECT,
          name: 'category',
          label: 'Category',
          description: `The category of the ${objectName}`,
          icon: 'IconTag',
          options,
        },
      ],
      workspaceId,
    });

    this.logger.log(
      `Added category field to ${objectName} for workspace ${workspaceId}`,
    );
  }
}
