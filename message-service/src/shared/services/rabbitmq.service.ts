import { Injectable, OnModuleInit } from '@nestjs/common';
import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { PublishMessageBusDTO } from '../dtos/PublishMessageBusDTO'
import { ProfilesyncService } from './profilesync.service';
import { MessageBusEntityEnum } from 'src/utils/enums/MessageBusEnum';
import { ProfileCreateInput } from 'src/generated/prisma/models';

@Injectable()
export class RabbitMQService implements OnModuleInit {
    private channel: Channel;

    constructor(
        private readonly profileSyncService: ProfilesyncService
    ) { }

    async onModuleInit() {
        const connection = await amqp.connect('amqp://localhost');
        this.channel = await connection.createChannel();

        const exchange = 'devnexus_sync';
        await this.channel.assertExchange(exchange, 'fanout', { durable: true });

        const { queue } = await this.channel.assertQueue('', { exclusive: true });
        await this.channel.bindQueue(queue, exchange, '');

        await this.channel.consume(queue, (msg) => {
            void this.onConsume(msg);
        });
    }

    async onConsume(msg: ConsumeMessage | null) {
        if (!msg) return;

        try {
            const content = msg.content.toString();

            const data = JSON.parse(content) as PublishMessageBusDTO<any>;

            switch (data.MessageBusEntityEnum) {
                case MessageBusEntityEnum.Profile: {
                    await this.profileSyncService.eventDrive(data as PublishMessageBusDTO<ProfileCreateInput>);
                    break;
                }
                default:
                    console.log('Not implemented yet');
            }

            this.channel.ack(msg);
        } catch (error) {
            console.error('Error parsing message:', error);
            this.channel.nack(msg, false, false);
        }
    }
}