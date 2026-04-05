import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message } from 'src/generated/prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';


@Injectable()
export class MessagesService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
    private readonly profileBlocksService: ProfileblocksService,
  ) {

  }

  async createMessage(createEntity: CreateMessageDto) {
    const returnResult = new ReturnResult<Message>();
    try {
      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: createEntity.ChatId,
          Members: {
            has: this.userContext.getProfileId()
          }
        }
      })

      if (!chat) {
        returnResult.Message = "Chat can't be found or does not exist";
        return returnResult;
      }

      const profileBlocks = await this.profileBlocksService.checkBlocks(chat.Members.filter(x => x !== this.userContext.getProfileId()));

      if (profileBlocks) {
        returnResult.Message = "Forbidden";
        return returnResult;
      }

      const createMessage = await this.prismaService.message.create({
        data: {
          ...createEntity,
          SenderId: this.userContext.getProfileId()
        },
        include: {
          Chat: true
        }
      })
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
