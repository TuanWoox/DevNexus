import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { MuteSettingDto } from './dto/mute-setting.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { Page } from '../../shared/dtos/Page';

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Get('global')
  async getGlobal() {
    return await this.settingsService.getGlobalSetting();
  }

  @Patch('global')
  async updateGlobal(@Body() body: { AllNotifications: boolean }) {
    return await this.settingsService.updateGlobalSetting(body.AllNotifications);
  }

  @Post('mutes/paging')
  async getMutesPaging(@Body() page: Page<string>) {
    return await this.settingsService.getMutesPaging(page);
  }

  @Post('mutes')
  async addMute(@Body() dto: MuteSettingDto) {
    return await this.settingsService.addMute(dto);
  }

  @Delete('mutes')
  async removeMute(@Body() dto: MuteSettingDto) {
    return await this.settingsService.removeMute(dto);
  }
}
