import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { SyncDataFromPlatformModule } from '../sync-data-from-platform/sync-data-from-platform.module';

@Module({
    providers: [RabbitMQService],
    imports: [SyncDataFromPlatformModule],
    exports: [RabbitMQService]
})
export class RabbitMqModule { }
