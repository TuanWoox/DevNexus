import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { PublishMessageBusDTO } from '../../shared/dtos/helper/PublishMessageBusDTO'
import { MessageBusEnum } from 'src/utils/enums/MessageBusEnum';
import { ProfileCreateInput, ProfileUpdateInput } from 'src/generated/prisma/models';

@Injectable()
export class ProfilesyncService {
    constructor(private readonly prismaService: PrismaService) { }

    async eventDrive(
        publishMessage: PublishMessageBusDTO<any> // keep flexible here
    ) {
        try {
            switch (publishMessage.MessageBusEnum) {
                case MessageBusEnum.Create: {
                    await this.syncCreateProfile(publishMessage.Entity as ProfileCreateInput);
                    break;
                }
                case MessageBusEnum.Update: {
                    await this.syncUpdateProfile(publishMessage.Entity as ProfileUpdateInput);
                    break;
                }
                case MessageBusEnum.Delete: {
                    await this.syncDeleteProfile(publishMessage.Entity);
                    break;
                }
                default:
                    console.log('Unknown event');
            }
        } catch (e) {
            console.log(e);
        }
    }

    async syncCreateProfile(profile: ProfileCreateInput) {
        try {
            console.log(`[ProfileSync] Creating profile`, profile);
            const result = await this.prismaService.profile.create({
                data: profile,
            });
            console.log(`[ProfileSync] Profile created successfully with ID: ${result.Id}`);
            return result;
        } catch (e) {
            console.error(`[ProfileSync] Failed to create profile:`, e);
        }
    }

    async syncUpdateProfile(profile: ProfileUpdateInput) {
        try {
            const profileId = profile.Id as string;
            console.log(`[ProfileSync] Upserting profile with ID: ${profileId}`, profile);
            
            const { Id, ...updateData } = profile;
            
            // Upsert: Update if exists, create if not exists
            const result = await this.prismaService.profile.upsert({
                where: { Id: profileId },
                update: updateData,
                create: {
                    Id: profileId,
                    ...(updateData as any),
                },
            });
            console.log(`[ProfileSync] Profile upserted successfully`);
            return result;
        } catch (e) {
            console.error(`[ProfileSync] Failed to upsert profile:`, e);
        }
    }

    async syncDeleteProfile(profile: any) {
        try {
            const profileId = profile.Id as string;
            console.log(`[ProfileSync] Soft-deleting profile with ID: ${profileId}`);
            
            const result = await this.prismaService.profile.update({
                where: { Id: profileId },
                data: { 
                    Deleted: true, 
                    DateDeleted: new Date() 
                },
            });
            
            console.log(`[ProfileSync] Profile deleted successfully`);
            return result;
        } catch (e) {
            console.error(`[ProfileSync] Failed to delete profile:`, e);
        }
    }
}