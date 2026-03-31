import { Module } from '@nestjs/common';
import { MessageChatGateway } from './message-chat.gateway';

@Module({
    imports: [MessageChatGateway],
    controllers: [],
    providers: [MessageChatGateway],
})
export class MessageChatGatewayModule { }
