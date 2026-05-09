import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { PublishMessageBusDTO } from '../../shared/dtos/helper/PublishMessageBusDTO';
import { MessageBusEnum } from '../../utils/enums/MessageBusEnum';

@Injectable()
export class ProfileSyncService {
    private readonly logger = new Logger(ProfileSyncService.name);

    constructor(private readonly prisma: PrismaService) {}

    async eventDrive(publishMessage: PublishMessageBusDTO<any>) {
        try {
            switch (publishMessage.MessageBusEnum) {
                case MessageBusEnum.Create:
                    await this.syncCreateProfile(publishMessage.Entity);
                    break;
                case MessageBusEnum.Update:
                    await this.syncUpdateProfile(publishMessage.Entity);
                    break;
                case MessageBusEnum.Delete:
                    await this.syncDeleteProfile(publishMessage.Entity);
                    break;
                default:
                    this.logger.log('[ProfileSync] Unknown event type');
            }
        } catch (error) {
            this.logger.error('[ProfileSync] Event processing failed:', error);
        }
    }

    private async syncCreateProfile(profile: any) {
        try {
            this.logger.log(`[ProfileSync] Creating profile: ${profile.Id}`);
            
            // Create profile and NotificationGlobalSetting in a transaction
            await this.prisma.$transaction(async (tx) => {
                // Create profile
                await tx.profile.create({
                    data: {
                        Id: profile.Id,
                        FullName: profile.FullName,
                        AvatarUrl: profile.AvatarUrl,
                        BackgroundUrl: profile.BackgroundUrl,
                        Bio: profile.Bio,
                        ReputationPoints: profile.ReputationPoints,
                        TechStacks: profile.TechStacks,
                        IsPrivate: profile.IsPrivate,
                        ApplicationUserId: profile.ApplicationUserId,
                        DateCreated: profile.DateCreated,
                        DateModified: profile.DateModified,
                        Deleted: profile.Deleted,
                        DateDeleted: profile.DateDeleted,
                    },
                });

                // Create NotificationGlobalSetting (default: all notifications enabled)
                await tx.notificationGlobalSetting.create({
                    data: {
                        ProfileId: profile.Id,
                        AllNotifications: true,
                    },
                });
            });

            this.logger.log('[ProfileSync] Profile and settings created successfully');
        } catch (error) {
            this.logger.error('[ProfileSync] Create failed:', error);
        }
    }

    private async syncUpdateProfile(profile: any) {
        try {
            const profileId = profile.Id as string;
            this.logger.log(`[ProfileSync] Updating profile: ${profileId}`);
            
            // Upsert: Update if exists, create if not exists
            await this.prisma.$transaction(async (tx) => {
                // Upsert profile
                await tx.profile.upsert({
                    where: { Id: profileId },
                    update: {
                        FullName: profile.FullName,
                        AvatarUrl: profile.AvatarUrl,
                        BackgroundUrl: profile.BackgroundUrl,
                        Bio: profile.Bio,
                        ReputationPoints: profile.ReputationPoints,
                        TechStacks: profile.TechStacks,
                        IsPrivate: profile.IsPrivate,
                        ApplicationUserId: profile.ApplicationUserId,
                        DateModified: profile.DateModified,
                        Deleted: profile.Deleted,
                        DateDeleted: profile.DateDeleted,
                    },
                    create: {
                        Id: profile.Id,
                        FullName: profile.FullName,
                        AvatarUrl: profile.AvatarUrl,
                        BackgroundUrl: profile.BackgroundUrl,
                        Bio: profile.Bio,
                        ReputationPoints: profile.ReputationPoints,
                        TechStacks: profile.TechStacks,
                        IsPrivate: profile.IsPrivate,
                        ApplicationUserId: profile.ApplicationUserId,
                        DateCreated: profile.DateCreated,
                        DateModified: profile.DateModified,
                        Deleted: profile.Deleted,
                        DateDeleted: profile.DateDeleted,
                    },
                });

                // Upsert NotificationGlobalSetting (create if not exists)
                await tx.notificationGlobalSetting.upsert({
                    where: { ProfileId: profileId },
                    update: {}, // No update needed, just ensure it exists
                    create: {
                        ProfileId: profileId,
                        AllNotifications: true,
                    },
                });
            });

            this.logger.log('[ProfileSync] Profile updated successfully');
        } catch (error) {
            this.logger.error('[ProfileSync] Update failed:', error);
        }
    }

    private async syncDeleteProfile(profile: any) {
        try {
            const profileId = profile.Id as string;
            this.logger.log(`[ProfileSync] Soft-deleting profile: ${profileId}`);
            
            // Soft delete: set Deleted = true, DateDeleted = now
            await this.prisma.profile.update({
                where: { Id: profileId },
                data: { 
                    Deleted: true, 
                    DateDeleted: new Date() 
                },
            });
            
            this.logger.log('[ProfileSync] Profile deleted successfully');
        } catch (error) {
            this.logger.error('[ProfileSync] Delete failed:', error);
        }
    }
}
