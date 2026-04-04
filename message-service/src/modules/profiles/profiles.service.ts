import { Injectable, Scope } from '@nestjs/common';
import { Profile } from 'src/generated/prisma/client';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { PrismaService } from '../prisma-database/prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class ProfilesService {
  constructor(private readonly prismaService: PrismaService) {

  }

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
}
