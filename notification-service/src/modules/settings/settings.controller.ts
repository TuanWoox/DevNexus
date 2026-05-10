import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { MuteSettingDto } from './dto/mute-setting.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ReturnResult } from '../../shared/dtos/ReturnResult';

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('global')
  async getGlobal() {
    let returnResult = new ReturnResult<any>();
    try {
      returnResult = await this.settingsService.getGlobalSetting();
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Patch('global')
  async updateGlobal(@Body() body: { AllNotifications: boolean }) {
    let returnResult = new ReturnResult<any>();
    try {
      returnResult = await this.settingsService.updateGlobalSetting(body.AllNotifications);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Get('mutes')
  async getMutes() {
    let returnResult = new ReturnResult<any>();
    try {
      returnResult = await this.settingsService.getMutes();
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Post('mutes')
  async addMute(@Body() dto: MuteSettingDto) {
    let returnResult = new ReturnResult<any>();
    try {
      returnResult = await this.settingsService.addMute(dto);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Delete('mutes')
  async removeMute(@Body() dto: MuteSettingDto) {
    let returnResult = new ReturnResult<any>();
    try {
      returnResult = await this.settingsService.removeMute(dto);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
