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
import { ProfilechatsModule } from './modules/profilechats/profilechats.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { MessagesModule } from './modules/messages/messages.module';
import { MediasModule } from './modules/medias/medias.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    // ConfigModule MUST be first — it loads .env vars that other modules depend on
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),
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
    ProfilechatsModule,
    MessagesModule,
    MediasModule,
    MulterModule.register({
      storage: memoryStorage()
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),

  ],
  controllers: [],
  providers: []
})
export class AppModule { }
