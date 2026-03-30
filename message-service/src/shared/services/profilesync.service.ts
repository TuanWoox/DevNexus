import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PublishMessageBusDTO } from '../dtos/PublishMessageBusDTO'
import { MessageBusEnum } from 'src/utils/enums/MessageBusEnum';
import { ProfileCreateInput } from 'src/generated/prisma/models';

@Injectable()
export class ProfilesyncService {
    constructor(private readonly prismaService: PrismaService) { }

    async eventDrive(
        publishMessage: PublishMessageBusDTO<ProfileCreateInput> // keep flexible here
    ) {
        try {
            switch (publishMessage.MessageBusEnum) {
                case MessageBusEnum.Create: {
                    await this.syncCreateProfile(publishMessage.Entity);
                    break;
                }
                case MessageBusEnum.Update: {
                    break;
                }
                case MessageBusEnum.Delete: {
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
            return await this.prismaService.profile.create({
                data: profile,
            });
        } catch (e) {
            console.log(e);
        }
    }
}