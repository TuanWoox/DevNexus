import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Module({
  controllers: [],
  providers: [ProfilesService],
  exports: [ProfilesService]
})
export class ProfilesModule { }
