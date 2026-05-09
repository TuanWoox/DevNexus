import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { GroupChatsService } from './group-chats.service';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { AddMembersDto } from './dto/add-members.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import type { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@Controller('chats/:chatId')
@UseGuards(AuthGuard)
export class GroupChatsController {
  constructor(private readonly groupChatsService: GroupChatsService) {}

  @Get('members')
  @HttpCode(200)
  async getMembers(@Param('chatId') chatId: string) {
    return this.groupChatsService.getMembers(chatId);
  }

  @Patch('group')
  @HttpCode(200)
  async updateGroup(
    @Param('chatId') chatId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupChatsService.updateGroup(chatId, dto);
  }

  @Post('group/picture')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(200)
  async uploadGroupPicture(
    @Param('chatId') chatId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.groupChatsService.uploadGroupPicture(chatId, file);
  }

  @Post('members')
  @HttpCode(200)
  async addMembers(
    @Param('chatId') chatId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.groupChatsService.addMembers(chatId, dto);
  }

  @Delete('members/:profileId')
  @HttpCode(200)
  async removeMember(
    @Param('chatId') chatId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.groupChatsService.removeMember(chatId, profileId);
  }

  @Post('leave')
  @HttpCode(200)
  async leaveGroup(@Param('chatId') chatId: string) {
    return this.groupChatsService.leaveGroup(chatId);
  }

  @Patch('members/:profileId/role')
  @HttpCode(200)
  async updateMemberRole(
    @Param('chatId') chatId: string,
    @Param('profileId') profileId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.groupChatsService.updateMemberRole(chatId, profileId, dto);
  }

  @Post('transfer')
  @HttpCode(200)
  async transferOwnership(
    @Param('chatId') chatId: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.groupChatsService.transferOwnership(chatId, dto);
  }
}
