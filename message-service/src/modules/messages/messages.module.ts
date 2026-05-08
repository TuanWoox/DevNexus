import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ProfileblocksModule } from '../profileblocks/profileblocks.module';
import { MediasModule } from '../medias/medias.module';
import { MessageChatGatewayModule } from '../message-chat-gateway/message-chat-gateway.module';
import { ChatsQueryModule } from '../chats/chats-query.module';

@Module({
  imports: [ProfileblocksModule, MediasModule, MessageChatGatewayModule, ChatsQueryModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule { }
