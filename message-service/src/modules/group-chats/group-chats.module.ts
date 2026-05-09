import { Module } from '@nestjs/common';
import { GroupChatsController } from './group-chats.controller';
import { GroupChatsService } from './group-chats.service';
import { ProfileblocksModule } from '../profileblocks/profileblocks.module';
import { MediasModule } from '../medias/medias.module';
import { MessagesModule } from '../messages/messages.module';
import { MessageChatGatewayModule } from '../message-chat-gateway/message-chat-gateway.module';

@Module({
  imports: [ProfileblocksModule, MediasModule, MessagesModule, MessageChatGatewayModule],
  controllers: [GroupChatsController],
  providers: [GroupChatsService],
})
export class GroupChatsModule {}
