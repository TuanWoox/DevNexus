import { Module } from '@nestjs/common';
import { ChatsettingsService } from './chatsettings.service'
import { UserfollowsModule } from '../userfollows/userfollows.module';

@Module({
  imports: [UserfollowsModule],
  controllers: [],
  providers: [ChatsettingsService],
  exports: [ChatsettingsService]
})
export class ChatsettingsModule { }
