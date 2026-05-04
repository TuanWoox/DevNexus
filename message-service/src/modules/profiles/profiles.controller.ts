import { Controller, Get, Param, Post, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Page } from 'src/shared/dtos/paging/page';

@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) { }

  @Get('search')
  async search(@Query('q') query: string, @Query('exclude') exclude?: string) {
    const excludeIds = exclude ? exclude.split(',').filter(Boolean) : [];
    return this.profilesService.searchProfiles(query || '', excludeIds);
  }

  @Post('search/following')
  @HttpCode(200)
  async searchFollowing(@Body() page: Page<string>) {
    return this.profilesService.searchFollowedProfiles(page);
  }

  @Post('search/contacts')
  @HttpCode(200)
  async searchContacts(@Body() page: Page<string>) {
    return this.profilesService.searchContactProfiles(page);
  }

  @Get(':profileId')
  async getById(@Param('profileId') profileId: string) {
    return this.profilesService.getProfileById(profileId);
  }
}
