import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { CreateLeadCustomObjectCommand } from 'src/database/commands/upgrade-version-command/2-2/2-2-workspace-command-1800000000000-create-lead-custom-object.command';
import { CreateLeadConversionWorkflowsCommand } from 'src/database/commands/upgrade-version-command/2-2/2-2-workspace-command-1800000001000-create-lead-conversion-workflows.command';
import { CommandMenuItemModule } from 'src/engine/metadata-modules/command-menu-item/command-menu-item.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';

@Module({
  imports: [
    WorkspaceIteratorModule,
    ObjectMetadataModule,
    FieldMetadataModule,
    CommandMenuItemModule,
  ],
  providers: [
    CreateLeadCustomObjectCommand,
    CreateLeadConversionWorkflowsCommand,
  ],
})
export class V2_2_UpgradeVersionCommandModule {}
