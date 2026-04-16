import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';

@Injectable()
export class ProfilechatsService {
    constructor(private readonly prismaService: PrismaService) { }

    async initializeProfileChats(profileIds: string[], chatId: string) {
        const returnResult = new ReturnResult<boolean>();
        try {
            await this.prismaService.profileChat.createMany({
                data: (profileIds ?? []).map(x => ({ MemberId: x, ChatId: chatId }))
            })
            returnResult.Result = true;
        }
        catch (ex) {
            returnResult.Message = ex instanceof Error ? ex.message : String(ex);
        }
        return returnResult
    };
}
