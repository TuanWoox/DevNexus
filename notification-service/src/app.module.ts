import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaDatabaseModule } from './modules/prisma-database/prisma-database.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';
import { NotificationGatewayModule } from './modules/websocket/notification-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),
    PrismaDatabaseModule,
    AuthModule,
    NotificationsModule,
    SettingsModule,
    RabbitMQModule,
    NotificationGatewayModule,
  ],
})
export class AppModule {}
