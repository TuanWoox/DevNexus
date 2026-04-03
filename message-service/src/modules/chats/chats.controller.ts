import { Controller, Post, Body, HttpCode, UseGuards, } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ReturnResult } from 'src/shared/dtos/ReturnResult';
import { ReturnChat } from './dto/return-chat.dto';

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
}
