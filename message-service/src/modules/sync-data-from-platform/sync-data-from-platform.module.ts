import { Module } from '@nestjs/common';
import { ProfileblocksyncService } from 'src/modules/sync-data-from-platform/profileblocksync.service';
import { ProfilesyncService } from 'src/modules/sync-data-from-platform/profilesync.service';
import { UserfollowsyncService } from 'src/modules/sync-data-from-platform/userfollowsync.service';
import { MessageChatGatewayModule } from 'src/modules/message-chat-gateway/message-chat-gateway.module';


@Module({
    imports: [MessageChatGatewayModule],
    providers: [ProfileblocksyncService, ProfilesyncService, UserfollowsyncService],
    exports: [ProfileblocksyncService, ProfilesyncService, UserfollowsyncService]
})
export class SyncDataFromPlatformModule { }
