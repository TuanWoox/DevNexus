import { Module } from '@nestjs/common';
import { ProfileSyncService } from './profile-sync.service';
import { PrismaDatabaseModule } from '../prisma-database/prisma-database.module';

@Module({
    imports: [PrismaDatabaseModule],
    providers: [ProfileSyncService],
    exports: [ProfileSyncService],
})
export class ProfileSyncModule {}
