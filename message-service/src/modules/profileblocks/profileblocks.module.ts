import { Module } from '@nestjs/common';
import { ProfileblocksService } from './profileblocks.service';

@Module({
  controllers: [],
  providers: [ProfileblocksService],
  exports: [ProfileblocksService],
})
export class ProfileblocksModule { }
