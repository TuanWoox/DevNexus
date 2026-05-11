import { Body, Controller, Get, Post, Patch, Delete, Param, HttpCode, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReturnResult } from '../../shared/dtos/ReturnResult';
import type { PagedData } from '../../shared/dtos/PagedData';
import type { Page } from '../../shared/dtos/Page';
import type { Notification } from '../../generated/prisma/client';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('paging')
  @HttpCode(200)
  async getNotifications(@Body() page: Page<string>) {
    let returnResult = new ReturnResult<PagedData<string, Notification>>();
    try {
      returnResult = await this.notificationsService.getNotifications(page);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Get('unread-count')
  async getUnreadCount() {
    let returnResult = new ReturnResult<number>();
    try {
      returnResult = await this.notificationsService.getUnreadCount();
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Patch('mark-all-read')
  async markAllAsRead() {
    let returnResult = new ReturnResult<number>();
    try {
      returnResult = await this.notificationsService.markAllAsRead();
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    let returnResult = new ReturnResult<boolean>();
    try {
      returnResult = await this.notificationsService.markAsRead(id);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    let returnResult = new ReturnResult<boolean>();
    try {
      returnResult = await this.notificationsService.deleteNotification(id);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
