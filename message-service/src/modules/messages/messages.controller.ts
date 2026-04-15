import { Controller, Post, Param, ParseIntPipe, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import type { CreateMessageDto } from './dto/create-message.dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message, MessageReadReceipt } from 'src/generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body('createMessageDto') data: string,
    @UploadedFile() file?: Express.Multer.File
  ): Promise<ReturnResult<Message>> {
    const returnResult = new ReturnResult<Message>();
    try {
      const createMessageDto: CreateMessageDto = JSON.parse(data);
      return await this.messagesService.createMessage(createMessageDto, file);
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
      return returnResult;
    }
  }

  /**
   * Mark a message as read by the currently authenticated profile.
   * POST /messages/:id/read
   */
  @Post(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReturnResult<MessageReadReceipt>> {
    return this.messagesService.markAsRead(id);
  }

}
