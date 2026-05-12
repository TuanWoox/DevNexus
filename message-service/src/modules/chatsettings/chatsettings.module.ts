import { Module, Logger } from '@nestjs/common';
import { ChatsettingsService } from './chatsettings.service'
import { ChatsettingsController } from './chatsettings.controller';
import { UserfollowsModule } from '../userfollows/userfollows.module';
import { BullModule } from '@nestjs/bullmq';
import { ChatSettingProcessor } from './chatsetting.processor';
import { MessageChatGatewayModule } from '../message-chat-gateway/message-chat-gateway.module';
import { RabbitMqModule } from '../rabbit-mq/rabbit-mq.module';

@Module({
  imports: [
    UserfollowsModule,
    MessageChatGatewayModule,
    BullModule.registerQueue({
      name: 'chatsetting',
      prefix: 'chatsetting'
    }),
    RabbitMqModule,
  ],
  controllers: [ChatsettingsController],
  providers: [ChatsettingsService, ChatSettingProcessor, Logger],
  exports: [ChatsettingsService]
})
export class ChatsettingsModule { }
