import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationGatewayModule } from '../websocket/notification-gateway.module';
import { ProfileSyncModule } from '../profile-sync/profile-sync.module';

@Module({
  imports: [NotificationsModule, NotificationGatewayModule, ProfileSyncModule],
  providers: [RabbitMQService],
})
export class RabbitMQModule {}
