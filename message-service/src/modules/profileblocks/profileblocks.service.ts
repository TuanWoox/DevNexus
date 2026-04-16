import { Injectable, Scope } from '@nestjs/common';
import { UserContextService } from '../auth/userContext.service';
import { PrismaService } from '../prisma-database/prisma.service';
import { ProfileBlock } from 'src/generated/prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class ProfileblocksService {
  constructor(
    private readonly userContext: UserContextService,
    private readonly prismaService: PrismaService
  ) { }

  async checkBlocks(profileIds: string | string[]): Promise<ProfileBlock | null> {
    const currentUserId = this.userContext.getProfileId();
    const ids = Array.isArray(profileIds) ? profileIds : [profileIds];

    const profileBlock = await this.prismaService.profileBlock.findFirst({
      where: {
        OR: [
          {
            OwnerId: currentUserId,
            BlockedProfileId: { in: ids },
          }, // current user blocked them
          {
            OwnerId: { in: ids },
            BlockedProfileId: currentUserId,
          }, // they blocked current user
        ],
      },
    });

    return profileBlock;
  }
}
