/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { PublishMessageBusDTO } from '../../shared/dtos/helper/PublishMessageBusDTO';
import { MessageBusEnum } from 'src/utils/enums/MessageBusEnum';
import { ProfileBlockCreateInput } from 'src/generated/prisma/models';
import { ProfileBlock } from 'src/generated/prisma/client';
import { MessageChatGateway } from 'src/modules/message-chat-gateway/message-chat.gateway';

@Injectable()
export class ProfileblocksyncService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly gateway: MessageChatGateway,
    ) { }

    async eventDrive(
        publishMessage: PublishMessageBusDTO<any> // keep flexible here
    ) {
        try {
            switch (publishMessage.MessageBusEnum) {
                case MessageBusEnum.Create: {
                    await this.syncCreateProfileBlock(publishMessage.Entity as ProfileBlockCreateInput);
                    break;
                }
                case MessageBusEnum.Delete: {
                    await this.syncDeleteProfileBlock(publishMessage.Entity as ProfileBlock);
                    break;
                }

                case MessageBusEnum.BulkDelete: {
                    await this.syncBulkDeleteProfileBlock(publishMessage.Entity as ProfileBlock[]);
                    break;
                }
                default:
                    console.log('Unknown event');
            }
        } catch (e) {
            console.log(e);
        }
    }

    async syncCreateProfileBlock(profileBlock: ProfileBlockCreateInput) {
        try {
            console.log(`[ProfileBlockSync] Creating profile block`, profileBlock);
            await this.prismaService.profileBlock.create({
                data: profileBlock,
            });
            console.log(`[ProfileBlockSync] Profile block created successfully`);
            this.gateway.emitToUsers(
                [profileBlock.OwnerId as string, profileBlock.BlockedProfileId as string],
                'profile-blocked',
                { OwnerId: profileBlock.OwnerId, BlockedProfileId: profileBlock.BlockedProfileId },
            );
        } catch (e) {
            console.error(`[ProfileBlockSync] Failed to create profile block:`, e);
        }
    }

    async syncDeleteProfileBlock(profileBlock: ProfileBlock) {
        try {
            console.log(`[ProfileBlockSync] Deleting profile block with ID: ${profileBlock.Id}`);
            const result = await this.prismaService.profileBlock.deleteMany({
                where: {
                    Id: profileBlock.Id,
                },
            });
            if (result.count > 0) {
                console.log(`[ProfileBlockSync] Profile block deleted successfully`);
                this.gateway.emitToUsers(
                    [profileBlock.OwnerId, profileBlock.BlockedProfileId],
                    'profile-unblocked',
                    { OwnerId: profileBlock.OwnerId, BlockedProfileId: profileBlock.BlockedProfileId },
                );
            } else {
                console.warn(`[ProfileBlockSync] Profile block with ID ${profileBlock.Id} not found`);
            }
        } catch (e) {
            console.error(`[ProfileBlockSync] Failed to delete profile block:`, e);
        }
    }

    async syncBulkDeleteProfileBlock(profileBlocks: ProfileBlock[]) {
        try {
            const ids = profileBlocks.map((pb) => pb.Id);
            console.log(`[ProfileBlockSync] Bulk deleting ${ids.length} profile blocks:`, ids);
            const result = await this.prismaService.profileBlock.deleteMany({
                where: {
                    Id: {
                        in: ids,
                    },
                },
            });
            if (result.count > 0) {
                console.log(`[ProfileBlockSync] Successfully deleted ${result.count} profile block(s)`);
                for (const pb of profileBlocks) {
                    this.gateway.emitToUsers(
                        [pb.OwnerId, pb.BlockedProfileId],
                        'profile-unblocked',
                        { OwnerId: pb.OwnerId, BlockedProfileId: pb.BlockedProfileId },
                    );
                }
            } else {
                console.warn(`[ProfileBlockSync] No profile blocks found to delete`);
            }
        } catch (e) {
            console.error(`[ProfileBlockSync] Failed to bulk delete profile blocks:`, e);
        }
    }
}
