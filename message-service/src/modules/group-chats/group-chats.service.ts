import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';
import { MediasService } from '../medias/medias.service';
import { MessagesService } from '../messages/messages.service';
import { MessageChatGateway } from '../message-chat-gateway/message-chat.gateway';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Chat, ChatRole } from 'src/generated/prisma/client';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { AddMembersDto } from './dto/add-members.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import type { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@Injectable({ scope: Scope.REQUEST })
export class GroupChatsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
    private readonly profileBlocksService: ProfileblocksService,
    private readonly mediasService: MediasService,
    private readonly messagesService: MessagesService,
    private readonly gateway: MessageChatGateway,
  ) {}

  private async getGroupOrFail(chatId: string) {
    const chat = await this.prismaService.chat.findFirst({
      where: { Id: chatId, IsGroup: true },
    });
    if (!chat) throw new Error('Group not found');
    return chat;
  }

  private async getMemberSettingOrFail(chatId: string, profileId: string) {
    const setting = await this.prismaService.chatSetting.findFirst({
      where: { ChatId: chatId, ProfileId: profileId },
    });
    if (!setting) throw new Error('You are not a member of this group');
    return setting;
  }

  private async requireAdmin(chatId: string, profileId: string) {
    const setting = await this.getMemberSettingOrFail(chatId, profileId);
    if (setting.Role !== ChatRole.ADMIN) throw new Error('Only group admins can perform this action');
    return setting;
  }

  private async getOtherMemberIds(chatId: string, excludeProfileId: string): Promise<string[]> {
    const members = await this.prismaService.profileChat.findMany({
      where: { ChatId: chatId, MemberId: { not: excludeProfileId } },
      select: { MemberId: true },
    });
    return members.map((m) => m.MemberId);
  }

  private async sendSystemMessage(chatId: string, content: string) {
    try {
      await this.messagesService.createMessage({ ChatId: chatId, Content: content });
    } catch {
      // System message is best-effort; don't fail the operation
    }
  }

  // A. Get group members with roles
  async getMembers(chatId: string) {
    const returnResult = new ReturnResult<any[]>();
    try {
      const profileId = this.userContext.getProfileId();
      await this.getGroupOrFail(chatId);
      await this.getMemberSettingOrFail(chatId, profileId);

      const members = await this.prismaService.profileChat.findMany({
        where: { ChatId: chatId },
        include: {
          Member: {
            select: { Id: true, FullName: true, AvatarUrl: true },
          },
        },
      });

      const settings = await this.prismaService.chatSetting.findMany({
        where: { ChatId: chatId },
        select: { ProfileId: true, Role: true, NickName: true },
      });

      const settingMap = new Map(settings.map((s) => [s.ProfileId, s]));

      returnResult.Result = members.map((m) => ({
        ProfileId: m.MemberId,
        FullName: m.Member.FullName,
        AvatarUrl: m.Member.AvatarUrl,
        Role: settingMap.get(m.MemberId)?.Role ?? ChatRole.MEMBER,
        NickName: settingMap.get(m.MemberId)?.NickName ?? null,
      }));
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  // B. Update group info (name)
  async updateGroup(chatId: string, dto: UpdateGroupDto) {
    const returnResult = new ReturnResult<Chat>();
    try {
      const profileId = this.userContext.getProfileId();
      await this.getGroupOrFail(chatId);
      await this.requireAdmin(chatId, profileId);

      const updated = await this.prismaService.chat.update({
        where: { Id: chatId },
        data: { Name: dto.Name },
      });

      const otherIds = await this.getOtherMemberIds(chatId, profileId);
      this.gateway.emitToUsers(
        [profileId, ...otherIds],
        'group-updated',
        { ChatId: chatId, Name: updated.Name, ChatPictureUrl: updated.ChatPictureUrl },
      );

      returnResult.Result = updated;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  // C. Upload group picture
  async uploadGroupPicture(chatId: string, file: Express.Multer.File) {
    const returnResult = new ReturnResult<Chat>();
    try {
      const profileId = this.userContext.getProfileId();
      await this.getGroupOrFail(chatId);
      await this.requireAdmin(chatId, profileId);

      // Create a dummy message to attach the media to (needed by MediasService)
      const tempMessage = await this.prismaService.message.create({
        data: { Content: 'Group picture update', ChatId: chatId, SenderId: profileId },
      });

      const uploadResult = await this.mediasService.handleUpload(file, tempMessage.Id);
      if (uploadResult.Message) {
        returnResult.Message = uploadResult.Message;
        return returnResult;
      }

      const filename = uploadResult.Result as string;
      const updated = await this.prismaService.chat.update({
        where: { Id: chatId },
        data: { ChatPictureUrl: filename },
      });

      // Delete the temp message since it was just a vehicle for the media
      await this.prismaService.message.delete({ where: { Id: tempMessage.Id } }).catch(() => {});

      const otherIds = await this.getOtherMemberIds(chatId, profileId);
      this.gateway.emitToUsers(
        [profileId, ...otherIds],
        'group-updated',
        { ChatId: chatId, Name: updated.Name, ChatPictureUrl: updated.ChatPictureUrl },
      );

      returnResult.Result = updated;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  // D. Add members to group
  async addMembers(chatId: string, dto: AddMembersDto) {
    const returnResult = new ReturnResult<any[]>();
    try {
      const profileId = this.userContext.getProfileId();
      await this.getGroupOrFail(chatId);
      await this.requireAdmin(chatId, profileId);

      const existingMemberIds = (
        await this.prismaService.profileChat.findMany({
          where: { ChatId: chatId },
          select: { MemberId: true },
        })
      ).map((m) => m.MemberId);

      const newIds = dto.profileIds.filter((id) => !existingMemberIds.includes(id));
      if (newIds.length === 0) {
        returnResult.Message = 'All selected profiles are already members';
        return returnResult;
      }

      const block = await this.profileBlocksService.checkBlocks(newIds);
      if (block) {
        returnResult.Message = 'Cannot add a blocked user';
        return returnResult;
      }

      await this.prismaService.profileChat.createMany({
        data: newIds.map((id) => ({ MemberId: id, ChatId: chatId })),
      });

      await this.prismaService.chatSetting.createMany({
        data: newIds.map((id) => ({
          ChatId: chatId,
          ProfileId: id,
          IsRequested: false,
          Role: ChatRole.MEMBER,
        })),
      });

      const allMemberIds = [...existingMemberIds, ...newIds];
      this.gateway.emitToUsers(allMemberIds, 'member-added', {
        ChatId: chatId,
        NewMemberIds: newIds,
      });

      const adminName = (await this.prismaService.profile.findUnique({ where: { Id: profileId }, select: { FullName: true } }))?.FullName ?? 'Someone';
      const addedNames = (
        await this.prismaService.profile.findMany({
          where: { Id: { in: newIds } },
          select: { FullName: true },
        })
      ).map((p) => p.FullName).join(', ');

      await this.sendSystemMessage(chatId, `${adminName} added ${addedNames} to the group`);

      const updatedMembers = await this.getMembers(chatId);
      returnResult.Result = updatedMembers.Result;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  // E. Remove/kick member
  async removeMember(chatId: string, memberId: string) {
    const returnResult = new ReturnResult<boolean>();
    try {
      const profileId = this.userContext.getProfileId();
      await this.getGroupOrFail(chatId);

      const isSelfRemoval = profileId === memberId;

      if (!isSelfRemoval) {
        await this.requireAdmin(chatId, profileId);
        // Prevent kicking the last admin
        const targetSetting = await this.getMemberSettingOrFail(chatId, memberId);
        if (targetSetting.Role === ChatRole.ADMIN) {
          const adminCount = await this.prismaService.chatSetting.count({
            where: { ChatId: chatId, Role: ChatRole.ADMIN },
          });
          if (adminCount <= 1) {
            returnResult.Message = 'Cannot remove the last admin. Transfer ownership first.';
            return returnResult;
          }
        }
      } else {
        // Self-leave: check if last admin
        const mySetting = await this.getMemberSettingOrFail(chatId, profileId);
        if (mySetting.Role === ChatRole.ADMIN) {
          const adminCount = await this.prismaService.chatSetting.count({
            where: { ChatId: chatId, Role: ChatRole.ADMIN },
          });
          if (adminCount <= 1) {
            const otherMembers = await this.prismaService.profileChat.findMany({
              where: { ChatId: chatId, MemberId: { not: profileId } },
              select: { MemberId: true },
            });
            if (otherMembers.length > 0) {
              // Auto-promote oldest member to admin
              const oldestSetting = await this.prismaService.chatSetting.findFirst({
                where: {
                  ChatId: chatId,
                  ProfileId: { not: profileId },
                },
                orderBy: { DateCreated: 'asc' },
              });
              if (oldestSetting) {
                await this.prismaService.chatSetting.update({
                  where: { Id: oldestSetting.Id },
                  data: { Role: ChatRole.ADMIN },
                });
              }
            }
          }
        }
      }

      await this.prismaService.chatSetting.deleteMany({
        where: { ChatId: chatId, ProfileId: memberId },
      });
      await this.prismaService.profileChat.deleteMany({
        where: { ChatId: chatId, MemberId: memberId },
      });

      const allMemberIds = await this.getOtherMemberIds(chatId, '');
      this.gateway.emitToUsers([...allMemberIds, profileId].filter(Boolean), 'member-removed', {
        ChatId: chatId,
        ProfileId: memberId,
      });

      const removedName = (await this.prismaService.profile.findUnique({ where: { Id: memberId }, select: { FullName: true } }))?.FullName ?? 'Someone';
      const action = isSelfRemoval ? 'left' : 'was removed from';
      await this.sendSystemMessage(chatId, `${removedName} ${action} the group`);

      returnResult.Result = true;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  // F. Leave group (convenience - delegates to removeMember)
  async leaveGroup(chatId: string) {
    const profileId = this.userContext.getProfileId();
    return this.removeMember(chatId, profileId);
  }

  // G. Change member role
  async updateMemberRole(chatId: string, memberId: string, dto: UpdateRoleDto) {
    const returnResult = new ReturnResult<any>();
    try {
      const profileId = this.userContext.getProfileId();
      await this.getGroupOrFail(chatId);
      await this.requireAdmin(chatId, profileId);

      if (profileId === memberId) {
        returnResult.Message = 'Cannot change your own role. Use transfer ownership instead.';
        return returnResult;
      }

      const targetSetting = await this.getMemberSettingOrFail(chatId, memberId);

      if (dto.Role === ChatRole.MEMBER) {
        const adminCount = await this.prismaService.chatSetting.count({
          where: { ChatId: chatId, Role: ChatRole.ADMIN },
        });
        if (adminCount <= 1 && targetSetting.Role === ChatRole.ADMIN) {
          returnResult.Message = 'Cannot demote the last admin. Transfer ownership first.';
          return returnResult;
        }
      }

      const updated = await this.prismaService.chatSetting.update({
        where: { Id: targetSetting.Id },
        data: { Role: dto.Role },
      });

      const allMemberIds = await this.getOtherMemberIds(chatId, '');
      this.gateway.emitToUsers(
        [profileId, ...allMemberIds],
        'role-changed',
        { ChatId: chatId, ProfileId: memberId, NewRole: dto.Role },
      );

      const updaterName = (await this.prismaService.profile.findUnique({ where: { Id: profileId }, select: { FullName: true } }))?.FullName ?? 'Someone';
      const targetName = (await this.prismaService.profile.findUnique({ where: { Id: memberId }, select: { FullName: true } }))?.FullName ?? 'Someone';
      await this.sendSystemMessage(chatId, `${updaterName} changed ${targetName}'s role to ${dto.Role}`);

      returnResult.Result = updated;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  // H. Transfer ownership
  async transferOwnership(chatId: string, dto: TransferOwnershipDto) {
    const returnResult = new ReturnResult<Chat>();
    try {
      const profileId = this.userContext.getProfileId();
      await this.getGroupOrFail(chatId);
      await this.requireAdmin(chatId, profileId);

      if (profileId === dto.newOwnerProfileId) {
        returnResult.Message = 'You are already the owner';
        return returnResult;
      }

      const targetSetting = await this.getMemberSettingOrFail(chatId, dto.newOwnerProfileId);
      const mySetting = await this.getMemberSettingOrFail(chatId, profileId);

      await this.prismaService.chatSetting.update({
        where: { Id: mySetting.Id },
        data: { Role: ChatRole.MEMBER },
      });
      await this.prismaService.chatSetting.update({
        where: { Id: targetSetting.Id },
        data: { Role: ChatRole.ADMIN },
      });

      const allMemberIds = await this.getOtherMemberIds(chatId, '');
      this.gateway.emitToUsers(
        [profileId, ...allMemberIds],
        'ownership-transferred',
        { ChatId: chatId, OldOwnerId: profileId, NewOwnerId: dto.newOwnerProfileId },
      );

      const oldName = (await this.prismaService.profile.findUnique({ where: { Id: profileId }, select: { FullName: true } }))?.FullName ?? 'Someone';
      const newName = (await this.prismaService.profile.findUnique({ where: { Id: dto.newOwnerProfileId }, select: { FullName: true } }))?.FullName ?? 'Someone';
      await this.sendSystemMessage(chatId, `${oldName} transferred group ownership to ${newName}`);

      const updated = await this.prismaService.chat.findUnique({ where: { Id: chatId } });
      returnResult.Result = updated!;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
