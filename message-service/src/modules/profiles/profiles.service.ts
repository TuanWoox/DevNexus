import { Injectable, Scope } from '@nestjs/common';
import { Profile } from 'src/generated/prisma/client';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { Page } from 'src/shared/dtos/paging/page';
import { PagedData } from 'src/shared/dtos/paging/pagedData';

@Injectable({ scope: Scope.REQUEST })
export class ProfilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
  ) {}

  async findProfiles(profileIds: string | string[]) {
    const returnResult: ReturnResult<Profile[]> = new ReturnResult<Profile[]>();
    try {
      const ids = Array.isArray(profileIds) ? profileIds : [profileIds];

      if (!ids || ids.length === 0) {
        returnResult.Message = "No profile IDs provided";
        return returnResult;
      }

      const profiles = await this.prismaService.profile.findMany({
        where: {
          Id: { in: ids }
        }
      });

      if (!profiles || profiles.length === 0) {
        returnResult.Message = "No profiles found";
        return returnResult;
      }

      // Check for missing profiles
      const foundIds = profiles.map(p => p.Id);
      const notFoundIds = ids.filter(id => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        returnResult.Message = `Some profiles not found: ${notFoundIds.join(', ')}`;
        return returnResult;
      }

      returnResult.Result = profiles;
    }
    catch (ex) {
      if (ex instanceof Error) {
        returnResult.Message = ex.message;
      } else {
        returnResult.Message = String(ex);
      }
    }
    return returnResult;
  }

  async searchProfiles(query: string, excludeIds: string[] = []) {
    const returnResult: ReturnResult<Profile[]> = new ReturnResult<Profile[]>();
    try {
      if (!query || query.trim().length === 0) {
        returnResult.Result = [];
        return returnResult;
      }

      const profiles = await this.prismaService.profile.findMany({
        where: {
          FullName: { contains: query.trim(), mode: 'insensitive' },
          ...(excludeIds.length > 0 && { Id: { notIn: excludeIds } }),
        },
        take: 20,
        select: { Id: true, FullName: true, AvatarUrl: true },
      });

      returnResult.Result = profiles as Profile[];
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async searchFollowedProfiles(page: Page<string>) {
    const returnResult = new ReturnResult<PagedData<string, Profile>>();
    try {
      const currentProfileId = this.userContext.getProfileId();
      const query = page.selected?.[0]?.trim() ?? '';
      const pageSize = Math.min(page.size ?? 10, 30);
      const pageNumber = page.pageNumber ?? 1;
      const offset = (pageNumber - 1) * pageSize;

      // Get all profileIds that the current user follows
      const follows = await this.prismaService.userFollow.findMany({
        where: { OwnerId: currentProfileId },
        select: { FollowingProfileId: true },
      });

      const followedIds = follows.map((f) => f.FollowingProfileId);
      if (followedIds.length === 0) {
        returnResult.Result = { page: { ...page, totalElements: 0 }, data: [] };
        return returnResult;
      }

      const where = {
        Id: { in: followedIds },
        ...(query && { FullName: { contains: query, mode: 'insensitive' as const } }),
      };

      const [totalElements, profiles] = await Promise.all([
        this.prismaService.profile.count({ where }),
        this.prismaService.profile.findMany({
          where,
          select: { Id: true, FullName: true, AvatarUrl: true },
          orderBy: { FullName: 'asc' },
          skip: offset,
          take: pageSize,
        }),
      ]);

      returnResult.Result = {
        page: { ...page, totalElements },
        data: profiles as unknown as Profile[],
      };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getProfileById(profileId: string) {
    const returnResult: ReturnResult<Profile> = new ReturnResult<Profile>();
    try {
      const profile = await this.prismaService.profile.findFirst({
        where: { Id: profileId },
        select: { Id: true, FullName: true, AvatarUrl: true } as any,
      });

      if (!profile) {
        returnResult.Message = 'Profile not found';
        return returnResult;
      }

      returnResult.Result = profile as unknown as Profile;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async searchContactProfiles(page: Page<string>) {
    const returnResult = new ReturnResult<PagedData<string, Profile>>();
    try {
      const currentProfileId = this.userContext.getProfileId();
      const query = page.selected?.[0]?.trim() ?? '';
      const pageSize = Math.min(page.size ?? 10, 30);
      const pageNumber = page.pageNumber ?? 1;
      const offset = (pageNumber - 1) * pageSize;

      // Find all personal chats the current user is a member of,
      // then extract the OTHER member's profile ID from each
      const personalChats = await this.prismaService.profileChat.findMany({
        where: {
          MemberId: { not: currentProfileId },
          Chat: {
            IsGroup: false,
            Members: { some: { MemberId: currentProfileId } },
          },
        },
        select: { MemberId: true },
        distinct: ['MemberId'],
      });

      const contactIds = personalChats.map((pc) => pc.MemberId);
      if (contactIds.length === 0) {
        returnResult.Result = { page: { ...page, totalElements: 0 }, data: [] };
        return returnResult;
      }

      const where = {
        Id: { in: contactIds },
        ...(query && { FullName: { contains: query, mode: 'insensitive' as const } }),
      };

      const [totalElements, profiles] = await Promise.all([
        this.prismaService.profile.count({ where }),
        this.prismaService.profile.findMany({
          where,
          select: { Id: true, FullName: true, AvatarUrl: true },
          orderBy: { FullName: 'asc' },
          skip: offset,
          take: pageSize,
        }),
      ]);

      returnResult.Result = {
        page: { ...page, totalElements },
        data: profiles as unknown as Profile[],
      };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
