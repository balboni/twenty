import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { CreateLeadCustomObjectCommand } from 'src/database/commands/upgrade-version-command/2-2/2-2-workspace-command-1800000000000-create-lead-custom-object.command';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';

@Module({
  imports: [WorkspaceIteratorModule, ObjectMetadataModule, FieldMetadataModule],
  providers: [CreateLeadCustomObjectCommand],
})
export class V2_2_UpgradeVersionCommandModule {}
