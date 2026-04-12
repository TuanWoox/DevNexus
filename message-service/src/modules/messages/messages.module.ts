import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ProfileblocksModule } from '../profileblocks/profileblocks.module';
import { MediasModule } from '../medias/medias.module';

@Module({
  imports: [ProfileblocksModule, MediasModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule { }
