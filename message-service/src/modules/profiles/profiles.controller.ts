import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('search')
  async search(@Query('q') query: string, @Query('exclude') exclude?: string) {
    const excludeIds = exclude ? exclude.split(',').filter(Boolean) : [];
    return this.profilesService.searchProfiles(query || '', excludeIds);
  }
}
