/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RabbitMQService } from './rabbitmq.service';
import { ProfileblocksyncService } from './profileblocksync.service';
import { ProfilesyncService } from './profilesync.service';
import { UserfollowsyncService } from './userfollowsync.service';

@Module({
    imports: [],
    controllers: [],
    providers: [
        PrismaService,
        RabbitMQService,
        ProfileblocksyncService,
        ProfilesyncService,
        UserfollowsyncService
    ],
    exports: [
        PrismaService,
        RabbitMQService,
        ProfileblocksyncService,
        ProfilesyncService,
        UserfollowsyncService
    ]
})
export class ShareServiceModule { }
