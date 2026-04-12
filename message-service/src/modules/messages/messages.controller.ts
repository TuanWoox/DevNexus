import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import type { CreateMessageDto } from './dto/create-message.dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message } from 'src/generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {

  }
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body('createMessageDto') data: string,  // <-- match the key name
    @UploadedFile() file?: Express.Multer.File
  ) {
    let returnResult = new ReturnResult<Message>();
    try {
      const createMessageDto: CreateMessageDto = JSON.parse(data);
      returnResult = await this.messagesService.createMessage(createMessageDto, file);
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
