import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message } from 'src/generated/prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';
import { MediasService } from '../medias/medias.service';


@Injectable({ scope: Scope.REQUEST })
export class MessagesService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
    private readonly profileBlocksService: ProfileblocksService,
    private readonly mediasService: MediasService
  ) {

  }

  async createMessage(createEntity: CreateMessageDto, file?: Express.Multer.File) {
    const returnResult = new ReturnResult<Message>();
    try {

      if (!createEntity.ChatId) {
        returnResult.Message = "Id cant be empty or blank spaces"
        return returnResult;
      }

      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: createEntity.ChatId,
          Members: {
            some: {
              MemberId: this.userContext.getProfileId()
            }
          }
        },
        include: {
          Members: true
        }
      })

      if (!chat) {
        returnResult.Message = "Chat can't be found or does not exist";
        return returnResult;
      }

      const otherMemberIds = chat.Members.filter(x => x.MemberId !== this.userContext.getProfileId()).map(x => x.MemberId);
      const profileBlocks = await this.profileBlocksService.checkBlocks(otherMemberIds);

      if (profileBlocks) {
        returnResult.Message = "Forbidden";
        return returnResult;
      }

      const createMessage = await this.prismaService.message.create({
        data: {
          Content: createEntity.Content,
          ChatId: createEntity.ChatId,
          SenderId: this.userContext.getProfileId()
        },
        include: {
          Chat: true
        }
      })

      if (file) {
        await this.mediasService.handleUpload(file)
      }

      //After create use some websocket to notify the other person
      //TODO IMPLEMENT 06 -> 07 /04/206
      returnResult.Result = createMessage;
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
