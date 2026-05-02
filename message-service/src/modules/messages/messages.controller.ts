import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, Body, HttpCode, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import type { CreateMessageDto } from './dto/create-message.dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message, MessageReadReceipt, Media } from 'src/generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Page } from 'src/shared/dtos/paging/page';
import type { PagedData } from 'src/shared/dtos/paging/pagedData';


@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

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

  @Post('read')
  async markAsRead(
    @Body('chatId') chatId: string,
  ): Promise<ReturnResult<MessageReadReceipt>> {
    return this.messagesService.markAsRead(chatId);
  }

  @Post('paging/:chatId')
  @HttpCode(200)
  async messagePaging(
    @Param('chatId') chatId: string,
    @Body() page: Page<number>,
  ): Promise<ReturnResult<PagedData<number, Message>>> {
    const returnResult = new ReturnResult<PagedData<number, Message>>();
    try {
      return await this.messagesService.getMessagePaging(chatId, page);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
      return returnResult;
    }
  }

  @Post('media/:chatId')
  @HttpCode(200)
  async chatMediaPaging(
    @Param('chatId') chatId: string,
    @Body() page: Page<string>,
  ): Promise<ReturnResult<PagedData<string, Media>>> {
    const returnResult = new ReturnResult<PagedData<string, Media>>();
    try {
      return await this.messagesService.getMediaPaging(chatId, page);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
      return returnResult;
    }
  }

  @Post(':messageId/readers')
  @HttpCode(200)
  async messageReaders(
    @Param('messageId') messageId: string,
    @Body() page: Page<number>,
  ): Promise<ReturnResult<PagedData<number, MessageReadReceipt>>> {
    const returnResult = new ReturnResult<PagedData<number, MessageReadReceipt>>();
    try {
      return await this.messagesService.getMessageReaders(parseInt(messageId, 10), page);
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
      return returnResult;
    }
  }
}

