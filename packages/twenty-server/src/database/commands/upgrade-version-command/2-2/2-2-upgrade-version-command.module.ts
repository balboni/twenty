import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { CreateLeadCustomObjectCommand } from 'src/database/commands/upgrade-version-command/2-2/2-2-workspace-command-1800000000000-create-lead-custom-object.command';
import { CreateLeadConversionWorkflowsCommand } from 'src/database/commands/upgrade-version-command/2-2/2-2-workspace-command-1800000001000-create-lead-conversion-workflows.command';
import { AddCategoryToCompanyAndPersonCommand } from 'src/database/commands/upgrade-version-command/2-2/2-2-workspace-command-1800000002000-add-category-to-company-and-person.command';
import { CommandMenuItemModule } from 'src/engine/metadata-modules/command-menu-item/command-menu-item.module';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';

@Module({
  imports: [
    WorkspaceIteratorModule,
    ObjectMetadataModule,
    FieldMetadataModule,
    CommandMenuItemModule,
    TypeOrmModule.forFeature([FieldMetadataEntity]),
  ],
  providers: [
    CreateLeadCustomObjectCommand,
    CreateLeadConversionWorkflowsCommand,
    AddCategoryToCompanyAndPersonCommand,
  ],
})
export class V2_2_UpgradeVersionCommandModule {}
