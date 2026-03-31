import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service"
import { RabbitMqModule } from './modules/rabbit-mq/rabbit-mq.module';
import { MessageChatGatewayModule } from './modules/message-chat-gateway/message-chat-gateway.module';
import { SyncDataFromPlatformModule } from './modules/sync-data-from-platform/sync-data-from-platform.module';
import { PrismaDatabaseModule } from './modules/prisma-database/prisma-database.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    MessageChatGatewayModule,
    RabbitMqModule,
    MessageChatGatewayModule,
    SyncDataFromPlatformModule,
    PrismaDatabaseModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
