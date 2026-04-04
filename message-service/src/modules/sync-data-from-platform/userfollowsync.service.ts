/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { PublishMessageBusDTO } from '../../shared/dtos/helper/PublishMessageBusDTO';
import { MessageBusEnum } from 'src/utils/enums/MessageBusEnum';
import { UserFollowCreateInput } from 'src/generated/prisma/models';
import { UserFollow } from 'src/generated/prisma/client';

@Injectable()
export class UserfollowsyncService {
    constructor(private readonly prismaService: PrismaService) { }

    async eventDrive(
        publishMessage: PublishMessageBusDTO<any> // keep flexible here
    ) {
        try {
            switch (publishMessage.MessageBusEnum) {
                case MessageBusEnum.Create: {
                    await this.syncCreateUserFollow(publishMessage.Entity as UserFollowCreateInput);
                    break;
                }
                case MessageBusEnum.Delete: {
                    await this.syncDeleteUserFollow(publishMessage.Entity as UserFollow);
                    break;
                }

                case MessageBusEnum.BulkDelete: {
                    await this.syncBulkDeleteUserFollow(publishMessage.Entity as UserFollow[]);
                    break;
                }
                default:
                    console.log('Unknown event');
            }
        } catch (e) {
            console.log(e);
        }
    }

    async syncCreateUserFollow(userFollow: UserFollowCreateInput) {
        try {
            console.log(`[UserFollowSync] Creating user follow`, userFollow);
            await this.prismaService.userFollow.create({
                data: userFollow,
            });
            console.log(`[UserFollowSync] User follow created successfully`);
        } catch (e) {
            console.error(`[UserFollowSync] Failed to create user follow:`, e);
        }
    }

    async syncDeleteUserFollow(userFollow: UserFollow) {
        try {
            console.log(`[UserFollowSync] Deleting user follow with ID: ${userFollow.Id}`);
            const result = await this.prismaService.userFollow.deleteMany({
                where: {
                    Id: userFollow.Id,
                },
            });
            if (result.count > 0) {
                console.log(`[UserFollowSync] User follow deleted successfully`);
            } else {
                console.warn(`[UserFollowSync] User follow with ID ${userFollow.Id} not found`);
            }
        } catch (e) {
            console.error(`[UserFollowSync] Failed to delete user follow:`, e);
        }
    }

    async syncBulkDeleteUserFollow(userFollows: UserFollow[]) {
        try {
            const ids = userFollows.map((uf) => uf.Id);
            console.log(`[UserFollowSync] Bulk deleting ${ids.length} user follows:`, ids);
            const result = await this.prismaService.userFollow.deleteMany({
                where: {
                    Id: {
                        in: ids,
                    },
                },
            });
            if (result.count > 0) {
                console.log(`[UserFollowSync] Successfully deleted ${result.count} user follow(s)`);
            } else {
                console.warn(`[UserFollowSync] No user follows found to delete`);
            }
        } catch (e) {
            console.error(`[UserFollowSync] Failed to bulk delete user follows:`, e);
        }
    }
}
