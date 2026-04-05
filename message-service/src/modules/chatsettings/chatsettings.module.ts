import { Module, Logger } from '@nestjs/common';
import { ChatsettingsService } from './chatsettings.service'
import { UserfollowsModule } from '../userfollows/userfollows.module';
import { BullModule } from '@nestjs/bullmq';
import { ChatSettingProcessor } from './chatsetting.processor';

@Module({
  imports: [
    UserfollowsModule,
    BullModule.registerQueue({
      name: 'chatsetting',
      prefix: 'chatsetting'
    }),
  ],
  controllers: [],
  providers: [ChatsettingsService, ChatSettingProcessor, Logger],
  exports: [ChatsettingsService]
})
export class ChatsettingsModule { }
