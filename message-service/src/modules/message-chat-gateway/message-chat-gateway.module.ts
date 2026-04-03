import { Module } from '@nestjs/common';
import { MessageChatGateway } from './message-chat.gateway';

@Module({
    controllers: [],
    providers: [MessageChatGateway],
})
export class MessageChatGatewayModule { }
