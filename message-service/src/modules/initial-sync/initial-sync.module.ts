import { Module } from '@nestjs/common';
import { InitialSyncService } from './initial-sync.service';

@Module({
  providers: [InitialSyncService],
  exports: [InitialSyncService],
})
export class InitialSyncModule {}
