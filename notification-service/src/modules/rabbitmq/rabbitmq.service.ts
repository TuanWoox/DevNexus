import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import { NotificationEventDTO } from '../../shared/dtos/NotificationEventDTO';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private channel!: Channel;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationGateway: NotificationGateway,
  ) { }

  async onModuleInit() {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost';

    let connection: Awaited<ReturnType<typeof amqp.connect>> | undefined;
    let retries = 10;
    while (retries) {
      try {
        connection = await amqp.connect(rabbitUrl);
        break;
      } catch {
        this.logger.error(`RabbitMQ connection failed, retrying in 5s... (${retries} attempts left)`);
        retries -= 1;
        await new Promise((res) => setTimeout(res, 5000));
      }
    }

    if (!connection) throw new Error('Could not connect to RabbitMQ');

    this.channel = await connection.createChannel();

    const exchange = 'devnexus_notifications';
    await this.channel.assertExchange(exchange, 'fanout', { durable: true });

    const { queue } = await this.channel.assertQueue('notification_service_queue', { durable: true });
    await this.channel.bindQueue(queue, exchange, '');

    await this.channel.consume(queue, (msg) => {
      void this.onConsume(msg);
    });

    this.logger.log('RabbitMQ consumer ready — listening on devnexus_notifications');
  }

  private async onConsume(msg: ConsumeMessage | null) {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString()) as NotificationEventDTO;
      const created = await this.notificationsService.createFromEvent(event);

      // Emit real-time to each recipient
      for (const notification of created) {
        //After created => event to user
        this.notificationGateway.emitToUser(
          notification.RecipientId as string,
          'notification:new',
          notification,
        );
        //After created => event to user about the unread count
        this.notificationGateway.emitToUser(
          notification.RecipientId as string,
          'notification:unread-count',
          await this.notificationsService.getUnreadCountForUser(notification.RecipientId as string),
        );
      }

      this.channel.ack(msg);
    } catch (error) {
      this.logger.error('Error processing notification event:', error);
      this.channel.nack(msg, false, false);
    }
  }
}
