import { Module } from '@nestjs/common';
import { UserfollowsService } from './userfollows.service'

@Module({
  controllers: [],
  providers: [UserfollowsService],
  exports: [UserfollowsService]
})
export class UserfollowsModule { }
