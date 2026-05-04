import { Module } from '@nestjs/common';
import { ChatsQueryService } from './chats-query.service';

@Module({
  providers: [ChatsQueryService],
  exports: [ChatsQueryService],
})
export class ChatsQueryModule {}
