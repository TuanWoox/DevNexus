import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { ProfileblocksModule } from '../profileblocks/profileblocks.module';
import { ChatsettingsModule } from '../chatsettings/chatsettings.module';

@Module({
  imports: [ProfilesModule, ProfileblocksModule, ChatsettingsModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule { }
