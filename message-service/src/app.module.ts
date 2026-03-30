import { ProfilesyncService } from './shared/services/profilesync.service';
import { PrismaService } from "./shared/services/prisma.service";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RabbitMQService } from "./shared/services/rabbitmq.service";

@Module({
  imports: [],
  controllers: [AppController],
  providers: 
  [
        ProfilesyncService, 
        RabbitMQService,
        PrismaService, 
        AppService
  ],
})
export class AppModule {}
