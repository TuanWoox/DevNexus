import { Controller, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChatsettingsService } from './chatsettings.service';
import type { UpdateChatSettingDTO, UpdateNickName } from './dto/update-chatsetting-dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { ChatSetting } from 'src/generated/prisma/client';
import { AuthGuard } from '../auth/auth.guard';

@Controller('chatsettings')
@UseGuards(AuthGuard)
export class ChatsettingsController {
    constructor(private readonly chatsettingsService: ChatsettingsService) { }

    @Patch()
    async updateChatSetting(
        @Body() updateInfo: UpdateChatSettingDTO,
    ): Promise<ReturnResult<ChatSetting>> {
        return this.chatsettingsService.updateChatSetting(updateInfo);
    }

    @Patch('nickname')
    async updateNickName(
        @Body() updateNickName: UpdateNickName,
    ): Promise<ReturnResult<ChatSetting>> {
        return this.chatsettingsService.updateNickName(updateNickName);
    }

    @Delete(':id/messages')
    async deleteAllMessage(
        @Param('id') id: string,
    ): Promise<ReturnResult<ChatSetting>> {
        return this.chatsettingsService.deleteAllMessage(id);
    }
}
