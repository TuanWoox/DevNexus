import { Injectable, Scope } from '@nestjs/common';
import { UserContextService } from '../auth/userContext.service';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserFollow } from 'src/generated/prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class UserfollowsService {
    constructor(
        private readonly userContext: UserContextService,
        private readonly prismaService: PrismaService
    ) {

    }

    async getFollowersByProfiles(profileIds: string[]): Promise<UserFollow[]> {
        const currentProfileId = this.userContext.getProfileId();
        return await this.prismaService.userFollow.findMany({
            where: {
                OwnerId: { in: profileIds },
                FollowingProfileId: currentProfileId
            }
        });
    }
}
