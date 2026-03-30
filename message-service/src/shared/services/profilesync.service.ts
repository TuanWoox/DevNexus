import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PublishMessageBusDTO } from '../dtos/PublishMessageBusDTO'
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
            console.log(`[ProfileSync] Updating profile with ID: ${profileId}`, profile);
            const { ...updateData } = profile;
            const result = await this.prismaService.profile.update({
                where: { Id: profileId },
                data: updateData,
            });
            console.log(`[ProfileSync] Profile updated successfully`);
            return result;
        } catch (e) {
            console.error(`[ProfileSync] Failed to update profile:`, e);
        }
    }
}