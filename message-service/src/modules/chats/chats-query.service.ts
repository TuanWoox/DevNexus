import { Injectable } from '@nestjs/common';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { PrismaService } from '../prisma-database/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

export type ChatWithFullDetails = Prisma.ChatGetPayload<{
  include: {
    Members: { include: { Member: { select: { FullName: true; AvatarUrl: true } } } };
    ChatSettings: true;
    Messages: {
      take: 1;
      include: {
        Sender: { select: { FullName: true; AvatarUrl: true } };
        ReadReceipts: { include: { Reader: { select: { FullName: true; AvatarUrl: true } } } };
        Medias: true;
      };
    };
  };
}>;

@Injectable()
export class ChatsQueryService {
  constructor(private readonly prismaService: PrismaService) { }

  async getChatByIdWithAllSettings(chatId: string, requesterId: string): Promise<ReturnResult<ChatWithFullDetails>> {
    const returnResult = new ReturnResult<ChatWithFullDetails>();
    try {
      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: chatId,
          Members: { some: { MemberId: requesterId } },
        },
        include: {
          Members: {
            include: {
              Member: { select: { FullName: true, AvatarUrl: true } },
            },
          },
          ChatSettings: true,
          Messages: {
            orderBy: { DateCreated: 'desc' as const },
            take: 1,
            include: {
              Sender: { select: { FullName: true, AvatarUrl: true } },
              ReadReceipts: {
                include: {
                  Reader: { select: { FullName: true, AvatarUrl: true } },
                },
              },
              Medias: true,
            },
          },
        },
      });

      if (!chat) {
        returnResult.Message = 'Chat not found or access denied';
        return returnResult;
      }

      returnResult.Result = chat;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
