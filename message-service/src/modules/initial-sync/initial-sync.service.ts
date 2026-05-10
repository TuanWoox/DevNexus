import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { PagedData } from 'src/shared/dtos/paging/pagedData';

@Injectable()
export class InitialSyncService {
  private readonly logger = new Logger(InitialSyncService.name);
  private readonly platformUrl: string;
  private readonly apiKey: string;
  private isSyncing = false;
  private hasSynced = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.platformUrl = this.configService.get<string>('PLATFORM_CORE_URL') || 'http://localhost:5105/api';
    this.apiKey = this.configService.get<string>('MICROSERVICE_API_KEY') || 'devnexus-microservice-api-key-change-in-production';
  }

  /**
   * Called during application bootstrap (main.ts)
   * This BLOCKs startup until sync is complete, guaranteeing DB is ready.
   */
  async performInitialSync(): Promise<void> {
    if (this.hasSynced) return;
    this.isSyncing = true;
    this.logger.log('🚀 Starting Initial Sync with Platform-Core-Service...');

    try {
      await this.syncProfiles();
      await this.syncProfileBlocks();
      await this.syncUserFollows();

      this.logger.log('✅ Initial Sync Completed Successfully.');
      this.hasSynced = true;
    } catch (error) {
      this.logger.error('❌ Initial Sync Failed. Database might be incomplete.', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncProfiles() {
    this.logger.log('Checking Profile Sync...');

    try {
      const existingIds = (await this.prisma.profile.findMany({
        select: { Id: true },
      })).map(x => x.Id);

      const countResponse = await this.fetchFromPlatform<number>('/MicroserviceSync/profiles/count');
      const platformCount = countResponse.Result || 0;

      if (platformCount === existingIds.length) {
        this.logger.log(`Profiles are already in sync (Count: ${platformCount}).`);
        return;
      }

      this.logger.log(`Fetching missing profiles (Platform: ${platformCount}, Local: ${existingIds.length})...`);
      let pageNumber = 0;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const response = await this.fetchFromPlatform<PagedData<string, any>>('/MicroserviceSync/profiles/paging', 'POST', {
          size: 50,
          pageNumber: pageNumber,
          selected: existingIds,
          filter: [],
          orders: [],
          totalElements: 0,
        });

        const pagedData = response.Result;
        if (!pagedData || !pagedData.data || pagedData.data.length === 0) {
          hasMore = false;
          break;
        }

        const profiles = pagedData.data;
        this.logger.log(`Received batch of ${profiles.length} profiles (Page ${pageNumber}). Syncing...`);

        await this.prisma.$transaction(
          profiles.map((p) =>
            this.prisma.profile.upsert({
              where: { Id: p.id },
              update: {},
              create: {
                Id: p.id,
                FullName: p.fullName,
                AvatarUrl: p.avatarUrl,
                BackgroundUrl: p.backgroundUrl,
                Bio: p.bio,
                ReputationPoints: p.reputationPoints,
                TechStacks: p.techStacks,
                IsPrivate: p.isPrivate,
                ApplicationUserId: p.applicationUserId,
                DateCreated: p.dateCreated ? new Date(p.dateCreated) : new Date(),
                DateModified: p.dateModified ? new Date(p.dateModified) : new Date(),
              },
            })
          )
        );

        totalSynced += profiles.length;
        if (pagedData.page && totalSynced >= pagedData.page.totalElements) {
          hasMore = false;
        } else {
          pageNumber++;
        }
      }

      this.logger.log(`🎉 Profile sync complete! Synced ${totalSynced} new profiles.`);

    } catch (error) {
      this.logger.error('Failed to sync profiles', error);
      throw error;
    }
  }

  private async syncProfileBlocks() {
    this.logger.log('Checking ProfileBlock Sync...');

    try {
      const existingIds = (await this.prisma.profileBlock.findMany({
        select: { Id: true },
      })).map(x => x.Id);

      const countResponse = await this.fetchFromPlatform<number>('/MicroserviceSync/profile-blocks/count');
      const platformCount = countResponse.Result || 0;

      if (platformCount === existingIds.length) {
        this.logger.log(`ProfileBlocks are already in sync (Count: ${platformCount}).`);
        return;
      }

      this.logger.log(`Fetching missing profile blocks...`);
      let pageNumber = 0;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const response = await this.fetchFromPlatform<PagedData<string, any>>('/MicroserviceSync/profile-blocks/paging', 'POST', {
          size: 50,
          pageNumber: pageNumber,
          selected: existingIds,
          filter: [],
          orders: [],
          totalElements: 0,
        });

        const pagedData = response.Result;
        if (!pagedData || !pagedData.data || pagedData.data.length === 0) {
          hasMore = false;
          break;
        }

        const blocks = pagedData.data;
        this.logger.log(`Received batch of ${blocks.length} blocks (Page ${pageNumber}). Syncing...`);

        await this.prisma.$transaction(
          blocks.map((b) =>
            this.prisma.profileBlock.upsert({
              where: { Id: b.id },
              update: {},
              create: {
                Id: b.id,
                OwnerId: b.ownerId,
                BlockedProfileId: b.blockedProfileId,
                DateCreated: b.dateCreated ? new Date(b.dateCreated) : new Date(),
                DateModified: b.dateModified ? new Date(b.dateModified) : new Date(),
              },
            })
          )
        );

        totalSynced += blocks.length;
        if (pagedData.page && totalSynced >= pagedData.page.totalElements) {
          hasMore = false;
        } else {
          pageNumber++;
        }
      }

      this.logger.log(`🎉 ProfileBlock sync complete! Synced ${totalSynced} new blocks.`);

    } catch (error) {
      this.logger.error('Failed to sync profile blocks', error);
      throw error;
    }
  }

  private async syncUserFollows() {
    this.logger.log('Checking UserFollow Sync...');

    try {
      const existingIds = (await this.prisma.userFollow.findMany({
        select: { Id: true },
      })).map(x => x.Id);

      const countResponse = await this.fetchFromPlatform<number>('/MicroserviceSync/user-follows/count');
      const platformCount = countResponse.Result || 0;

      if (platformCount === existingIds.length) {
        this.logger.log(`UserFollows are already in sync (Count: ${platformCount}).`);
        return;
      }

      this.logger.log(`Fetching missing user follows...`);
      let pageNumber = 0;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const response = await this.fetchFromPlatform<PagedData<string, any>>('/MicroserviceSync/user-follows/paging', 'POST', {
          size: 50,
          pageNumber: pageNumber,
          selected: existingIds,
          filter: [],
          orders: [],
          totalElements: 0,
        });

        const pagedData = response.Result;
        if (!pagedData || !pagedData.data || pagedData.data.length === 0) {
          hasMore = false;
          break;
        }

        const follows = pagedData.data;
        this.logger.log(`Received batch of ${follows.length} follows (Page ${pageNumber}). Syncing...`);

        await this.prisma.$transaction(
          follows.map((f) =>
            this.prisma.userFollow.upsert({
              where: { Id: f.id },
              update: {},
              create: {
                Id: f.id,
                OwnerId: f.ownerId,
                FollowingProfileId: f.followingProfileId,
                DateCreated: f.dateCreated ? new Date(f.dateCreated) : new Date(),
                DateModified: f.dateModified ? new Date(f.dateModified) : new Date(),
              },
            })
          )
        );

        totalSynced += follows.length;
        if (pagedData.page && totalSynced >= pagedData.page.totalElements) {
          hasMore = false;
        } else {
          pageNumber++;
        }
      }

      this.logger.log(`🎉 UserFollow sync complete! Synced ${totalSynced} new follows.`);

    } catch (error) {
      this.logger.error('Failed to sync user follows', error);
      throw error;
    }
  }

  private async fetchFromPlatform<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<ReturnResult<T>> {
    const url = `${this.platformUrl}${endpoint}`;
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'X-Microservice-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    const returnResult = new ReturnResult<T>();
    returnResult.Result = response.data.result;
    returnResult.Message = response.data.message;

    return returnResult;
  }
}
