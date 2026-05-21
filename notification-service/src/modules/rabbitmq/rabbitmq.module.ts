import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { PrismaDatabaseModule } from '../prisma-database/prisma-database.module';
import { NotificationGatewayModule } from '../websocket/notification-gateway.module';

@Module({
  imports: [PrismaDatabaseModule, NotificationGatewayModule],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule { }
