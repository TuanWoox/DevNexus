import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ProfileblocksModule } from '../profileblocks/profileblocks.module';

@Module({
  imports: [ProfileblocksModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule { }
