import { Module } from '@nestjs/common';
import { ProfileblocksyncService } from 'src/modules/sync-data-from-platform/profileblocksync.service';
import { ProfilesyncService } from 'src/modules/sync-data-from-platform/profilesync.service';
import { UserfollowsyncService } from 'src/modules/sync-data-from-platform/userfollowsync.service';


@Module({
    providers: [ProfileblocksyncService, ProfilesyncService, UserfollowsyncService],
    exports: [ProfileblocksyncService, ProfilesyncService, UserfollowsyncService]
})
export class SyncDataFromPlatformModule { }
