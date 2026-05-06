import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationGatewayModule } from '../websocket/notification-gateway.module';

@Module({
  imports: [NotificationsModule, NotificationGatewayModule],
  providers: [RabbitMQService],
})
export class RabbitMQModule {}
