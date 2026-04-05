import { Module } from "@nestjs/common";
import { RabbitMqModule } from './modules/rabbit-mq/rabbit-mq.module';
import { MessageChatGatewayModule } from './modules/message-chat-gateway/message-chat-gateway.module';
import { SyncDataFromPlatformModule } from './modules/sync-data-from-platform/sync-data-from-platform.module';
import { PrismaDatabaseModule } from './modules/prisma-database/prisma-database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatsModule } from './modules/chats/chats.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ProfileblocksModule } from './modules/profileblocks/profileblocks.module';
import { UserfollowsModule } from './modules/userfollows/userfollows.module';
import { ChatsettingsModule } from './modules/chatsettings/chatsettings.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { MessagesModule } from './modules/messages/messages.module';
@Module({
  imports: [
    MessageChatGatewayModule,
    RabbitMqModule,
    MessageChatGatewayModule,
    SyncDataFromPlatformModule,
    PrismaDatabaseModule,
    AuthModule,
    ChatsModule,
    ProfilesModule,
    ProfileblocksModule,
    UserfollowsModule,
    ChatsettingsModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    MessagesModule,
  ],
  controllers: [],
  providers: []
})
export class AppModule { }
