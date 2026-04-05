import { Controller, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message } from 'src/generated/prisma/client';


@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {

  }

  async create(createEntity: CreateMessageDto) {
    let returnResult = new ReturnResult<Message>();
    try {
      returnResult = await this.messagesService.createMessage(createEntity);
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
