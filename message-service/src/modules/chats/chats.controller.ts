import { Controller, Post, Body, HttpCode, UseGuards, Param, } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { ReturnChat } from './dto/return-chat.dto';
import type { Page } from 'src/shared/dtos/paging/page';
import type { PagedData } from 'src/shared/dtos/paging/pagedData';
import { Chat, Message } from 'src/generated/prisma/client';

@Controller('chats')
@UseGuards(AuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @Post()
  @HttpCode(200)
  async create(@Body() createChatDto: CreateChatDto) {
    let returnResult: ReturnResult<ReturnChat> = new ReturnResult<ReturnChat>();
    try {
      returnResult = await this.chatsService.create(createChatDto);
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

  @Post('paging')
  @HttpCode(200)
  async paging(@Body() page: Page<string>) {
    let returnResult = new ReturnResult<PagedData<string, Chat>>();
    try {
      returnResult = await this.chatsService.getPaging(page);
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

  @Post('message-paging/:chatId')
  @HttpCode(200)
  async messagePaging(@Param('chatId') id: string, @Body() page: Page<number>) {
    let returnResult = new ReturnResult<PagedData<number, Message>>();
    try {
      returnResult = await this.chatsService.getMessagePaging(id, page);
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
