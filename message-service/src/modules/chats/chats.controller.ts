import { Controller, Post, Body, HttpCode, UseGuards, UseInterceptors, UploadedFile, Query, } from '@nestjs/common';
import { ChatsService } from './chats.service';
import type { CreateChatDto } from './dto/create-chat.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import type { Page } from 'src/shared/dtos/paging/page';
import type { PagedData } from 'src/shared/dtos/paging/pagedData';
import { Chat } from 'src/generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chats')
@UseGuards(AuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(200)
  async create(
    @Body('createChatDto') data: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let returnResult: ReturnResult<Chat> = new ReturnResult<Chat>();
    try {
      const createChatDto: CreateChatDto = JSON.parse(data);
      returnResult = await this.chatsService.create(createChatDto, file);
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
  async paging(@Body() page: Page<string>, @Query('type') type?: string) {
    let returnResult = new ReturnResult<PagedData<string, Chat>>();
    try {
      returnResult = await this.chatsService.getPaging(page, type || "");
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

  @Post('search')
  @HttpCode(200)
  async search(@Body() page: Page<string>) {
    let returnResult = new ReturnResult<PagedData<string, Chat>>();
    try {
      returnResult = await this.chatsService.searchContactsAndGroups(page);
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
