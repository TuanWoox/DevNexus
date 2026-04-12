import { CreateMessageDto } from "src/modules/messages/dto/create-message.dto";

export interface CreateChatDto {
    profileIds: string[] | string
    name: string | undefined;
    message: CreateMessageDto
}
